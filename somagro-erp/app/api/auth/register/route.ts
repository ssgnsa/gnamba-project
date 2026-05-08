import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/admin";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

type RegisterPayload = {
  tenant_name?: string;
  tenant_slug?: string;
  full_name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: RegisterPayload = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const tenantName = payload.tenant_name?.trim();
  const tenantSlug = payload.tenant_slug?.trim().toLowerCase();
  const email = payload.email?.trim();
  const password = payload.password ?? "";

  if (!tenantName || !tenantSlug || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Champs requis manquants." },
      { status: 400 },
    );
  }

  if (!SLUG_PATTERN.test(tenantSlug)) {
    return NextResponse.json(
      { error: "Slug invalide (a-z, 0-9 et tirets)." },
      { status: 400 },
    );
  }

  const host = headers().get("host") ?? "";
  let admin;
  try {
    admin = createAdminSupabase(host);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }

  const { data: existingTenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (existingTenant) {
    return NextResponse.json(
      { error: "Ce slug existe deja." },
      { status: 409 },
    );
  }

  const { data: tenantData, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: tenantName,
      slug: tenantSlug,
      subscription_tier: "basic",
    })
    .select("id")
    .single();

  if (tenantError || !tenantData) {
    return NextResponse.json(
      { error: tenantError?.message ?? "Creation tenant impossible." },
      { status: 500 },
    );
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: userError?.message ?? "Creation utilisateur impossible." },
      { status: 500 },
    );
  }

  const { error: profileError } = await admin.from("users").insert({
    id: userData.user.id,
    tenant_id: tenantData.id,
    email,
    full_name: payload.full_name || null,
    role: "admin",
    is_active: true,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
