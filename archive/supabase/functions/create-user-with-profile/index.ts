import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_ORIGINS = [
  "https://gnambaservices.ci",
  "https://www.gnambaservices.ci",
  "https://portal.gnambaservices.ci",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(req),
    },
  });
}

function normalizeRole(
  accessLevel: string,
): "admin" | "gestionnaire" | "employe" {
  if (accessLevel === "admin") return "admin";
  if (accessLevel === "gerant" || accessLevel === "gestionnaire")
    return "gestionnaire";
  return "employe";
}

function isAdminUser(
  user:
    | {
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
      }
    | null
    | undefined,
): boolean {
  if (!user) return false;
  const role = String(
    user.app_metadata?.role ||
      user.app_metadata?.access_level ||
      user.user_metadata?.role ||
      user.user_metadata?.access_level ||
      "",
  ).toLowerCase();
  return role === "admin" || role === "gestionnaire";
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405,
      req,
    );
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse(
      { success: false, error: "Authorization header required" },
      401,
      req,
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return jsonResponse({ success: false, error: "Token manquant" }, 401, req);
  }

  const { data: authData, error: authError } =
    await anonClient.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse(
      { success: false, error: "Utilisateur non authentifié" },
      401,
      req,
    );
  }

  if (!isAdminUser(authData.user)) {
    return jsonResponse(
      { success: false, error: "Accès réservé aux administrateurs" },
      403,
      req,
    );
  }

  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      full_name?: string;
      access_level?: string;
      poste?: string;
      department?: string;
      phone?: string;
    };

    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();
    const fullName = String(body.full_name || "").trim();
    const accessLevel = String(body.access_level || "visiteur");
    const poste = String(body.poste || "").trim();
    const department = String(body.department || "").trim();
    const phone = String(body.phone || "").trim();

    if (!email || !email.includes("@")) {
      return jsonResponse(
        { success: false, error: "Adresse email invalide" },
        400,
        req,
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        { success: false, error: "Mot de passe trop court" },
        400,
        req,
      );
    }

    if (!fullName) {
      return jsonResponse(
        { success: false, error: "Nom complet requis" },
        400,
        req,
      );
    }

    const role = normalizeRole(accessLevel);

    const { data: createdUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          role,
          access_level: accessLevel,
        },
        user_metadata: {
          full_name: fullName,
          role,
          access_level: accessLevel,
          poste,
          department,
          phone,
        },
      });

    if (createError || !createdUser?.user) {
      return jsonResponse(
        {
          success: false,
          error: createError?.message || "Impossible de créer l’utilisateur",
        },
        400,
        req,
      );
    }

    const { error: profileError } = await serviceClient
      .from("user_profiles")
      .insert({
        id: createdUser.user.id,
        full_name: fullName,
        role,
        access_level: accessLevel,
        poste,
        department,
        phone,
        avatar_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(createdUser.user.id);
      return jsonResponse(
        {
          success: false,
          error: profileError.message || "Impossible de créer le profil",
        },
        400,
        req,
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Compte créé avec succès.",
        data: { userId: createdUser.user.id },
      },
      200,
      req,
    );
  } catch (error) {
    console.error("create-user-with-profile error:", error);
    return jsonResponse(
      { success: false, error: "Échec de la création du compte" },
      500,
      req,
    );
  }
};

Deno.serve(handler);
