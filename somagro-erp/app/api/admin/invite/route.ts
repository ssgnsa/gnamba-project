import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

type InvitePayload = {
  email?: string;
  full_name?: string;
  role?: string;
  tenant_id?: string;
  redirect_to?: string;
};

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, tenant_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  let payload: InvitePayload = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const email = payload.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const tenantId = payload.tenant_id || profile.tenant_id;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant requis." }, { status: 400 });
  }

  const host = headers().get("host") ?? "";
  const origin = headers().get("origin") ?? `https://${host}`;
  const redirectTo = payload.redirect_to || `${origin}/login`;

  let admin;
  try {
    admin = createAdminSupabase(host);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

  if (inviteError || !inviteData?.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Invitation impossible." },
      { status: 500 },
    );
  }

  const invitedUser = inviteData.user;
  const role = payload.role || "worker";

  const { error: upsertError } = await admin.from("users").upsert(
    {
      id: invitedUser.id,
      tenant_id: tenantId,
      email,
      full_name: payload.full_name || null,
      role,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: invitedUser.id });
}
