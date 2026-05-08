import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard as Edit,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import { ACCESS_LEVEL_LABELS, useAuth } from "../context/AuthContext";
import type { AccessLevel, UserRole } from "../types";

interface UserProfileRow {
  id: string;
  full_name: string;
  role: UserRole;
  access_level: AccessLevel | null;
  poste: string | null;
  department: string;
  avatar_url: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

interface UserFormState {
  id: string;
  full_name: string;
  access_level: AccessLevel;
  poste: string;
  department: string;
  phone: string;
  avatar_url: string;
}

interface CreateAccountFormState {
  email: string;
  password: string;
  full_name: string;
  access_level: AccessLevel;
  poste: string;
  department: string;
  phone: string;
  avatar_url: string;
}

const ACCESS_LEVEL_OPTIONS = Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[];

const ACCESS_LEVEL_COLORS: Record<
  AccessLevel,
  "green" | "red" | "orange" | "blue" | "gray" | "yellow"
> = {
  admin: "red",
  gerant: "blue",
  secretaire: "yellow",
  ouvrier: "orange",
  visiteur: "gray",
  gestionnaire: "blue",
  employe: "green",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  employe: "Employé",
};

const emptyForm: UserFormState = {
  id: "",
  full_name: "",
  access_level: "visiteur",
  poste: "",
  department: "",
  phone: "",
  avatar_url: "",
};

const emptyCreateForm: CreateAccountFormState = {
  email: "",
  password: "",
  full_name: "",
  access_level: "visiteur",
  poste: "",
  department: "",
  phone: "",
  avatar_url: "",
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasKnownAccessLevel(
  value: string | null | undefined,
): value is AccessLevel {
  if (!value) return false;
  return value in ACCESS_LEVEL_LABELS;
}

function normalizeAccessLevel(
  accessLevel: string | null | undefined,
  role: UserRole,
): AccessLevel {
  if (hasKnownAccessLevel(accessLevel)) return accessLevel;
  if (role === "admin") return "admin";
  if (role === "gestionnaire") return "gestionnaire";
  return "employe";
}

function mapAccessLevelToRole(level: AccessLevel): UserRole {
  if (level === "admin") return "admin";
  if (level === "gerant" || level === "gestionnaire") return "gestionnaire";
  return "employe";
}

export default function Utilisateurs() {
  const { settings } = useSettings();
  const { profile, refreshProfile } = useAuth();
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [createForm, setCreateForm] =
    useState<CreateAccountFormState>(emptyCreateForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("full_name");

    if (fetchError) {
      setError(`Chargement impossible: ${fetchError.message}`);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers((data as UserProfileRow[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openCreateAccount = () => {
    setCreateForm(emptyCreateForm);
    setError("");
    setCreateModalOpen(true);
  };

  const openEdit = (user: UserProfileRow) => {
    setEditingId(user.id);
    setForm({
      id: user.id,
      full_name: user.full_name || "",
      access_level: normalizeAccessLevel(user.access_level, user.role),
      poste: user.poste || "",
      department: user.department || "",
      phone: user.phone || "",
      avatar_url: user.avatar_url || "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    const fullName = form.full_name.trim();
    const userId = form.id.trim();

    if (!fullName) {
      setError("Le nom complet est obligatoire.");
      return;
    }

    if (!editingId && !uuidRegex.test(userId)) {
      setError("Renseigne un UUID utilisateur valide (depuis auth.users).");
      return;
    }

    setSaving(true);
    setError("");
    const technicalRole = mapAccessLevelToRole(form.access_level);
    const payload = {
      full_name: fullName,
      role: technicalRole,
      access_level: form.access_level,
      poste: form.poste.trim(),
      department: form.department.trim(),
      phone: form.phone.trim(),
      avatar_url: form.avatar_url.trim(),
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        setSaving(false);
        setError(`Mise à jour impossible: ${updateError.message}`);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({ id: userId, ...payload });

      if (insertError) {
        setSaving(false);
        setError(`Création impossible: ${insertError.message}`);
        return;
      }
    }

    if (profile?.id === (editingId || userId)) {
      await refreshProfile();
    }

    setSaving(false);
    setModalOpen(false);
    setSuccess(
      editingId ? "Profil utilisateur mis à jour." : "Profil utilisateur créé.",
    );
    setTimeout(() => setSuccess(""), 3000);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce profil utilisateur ?")) return;
    setError("");

    const { error: deleteError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(`Suppression impossible: ${deleteError.message}`);
      return;
    }

    if (profile?.id === id) {
      await refreshProfile();
    }

    setSuccess("Profil utilisateur supprimé.");
    setTimeout(() => setSuccess(""), 3000);
    fetchUsers();
  };

  const sendMagicLinkInvite = async (
    email: string,
    fullName: string,
    accessLevel: AccessLevel,
    poste: string,
    department: string,
    phone: string,
  ) => {
    const { error: inviteError } = await supabase.from("user_invites").upsert(
      {
        email,
        full_name: fullName,
        access_level: accessLevel,
        poste,
        department,
        phone,
      },
      { onConflict: "email" },
    );

    if (inviteError) {
      return {
        ok: false,
        message: `Invitation impossible: ${inviteError.message}`,
      };
    }

    const canonicalOrigin = import.meta.env.VITE_CANONICAL_ORIGIN;
    const redirectTo = canonicalOrigin || window.location.origin;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
        },
      },
    });

    if (otpError) {
      return {
        ok: false,
        message: `Invitation créée, mais l'email n'a pas pu être envoyé: ${otpError.message}`,
      };
    }

    return { ok: true };
  };

  const handleCreateAccount = async () => {
    const email = createForm.email.trim().toLowerCase();
    const password = createForm.password.trim();
    const fullName = createForm.full_name.trim();

    if (!email || !email.includes("@")) {
      setError("Adresse email invalide.");
      return;
    }

    if (password.length < 8) {
      setError("Mot de passe trop court (minimum 8 caractères).");
      return;
    }

    if (!fullName) {
      setError("Le nom complet est obligatoire.");
      return;
    }

    setCreatingAccount(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc(
      "create_user_with_profile",
      {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_access_level: createForm.access_level,
        p_poste: createForm.poste || "",
        p_department: createForm.department || "",
        p_phone: createForm.phone || "",
      },
    );

    const result = data as {
      error?: string;
      code?: string;
      message?: string;
      success?: boolean;
    } | null;

    if (!rpcError && result?.success) {
      setCreatingAccount(false);
      setCreateModalOpen(false);
      setSuccess(result.message || "Compte créé avec succès.");
      setTimeout(() => setSuccess(""), 3000);
      fetchUsers();
      return;
    }

    const blockingCode = result?.code;
    if (blockingCode === "EMAIL_EXISTS") {
      setCreatingAccount(false);
      setError("Un compte avec cet email existe déjà.");
      return;
    }
    if (blockingCode === "UNAUTHORIZED") {
      setCreatingAccount(false);
      setError("Session expirée. Merci de vous reconnecter puis réessayer.");
      return;
    }
    if (blockingCode === "FORBIDDEN") {
      setCreatingAccount(false);
      setError("Accès réservé aux administrateurs.");
      return;
    }

    if (rpcError) {
      if (import.meta.env.DEV) console.error("RPC error:", rpcError);
    } else if (result?.error) {
      if (import.meta.env.DEV)
        console.warn("RPC business error:", result.error);
    }

    const invite = await sendMagicLinkInvite(
      email,
      fullName,
      createForm.access_level,
      createForm.poste || "",
      createForm.department || "",
      createForm.phone || "",
    );

    setCreatingAccount(false);

    if (!invite.ok) {
      setError(
        `Création impossible via RPC. ${invite.message || "Invitation impossible."}`,
      );
      return;
    }

    setCreateModalOpen(false);
    setSuccess(
      "Invitation envoyée par email. L’utilisateur doit cliquer sur le lien pour activer son compte.",
    );
    setTimeout(() => setSuccess(""), 4000);
    fetchUsers();
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const accessLevel = normalizeAccessLevel(user.access_level, user.role);
        const haystack = [
          user.full_name,
          user.poste || "",
          user.department || "",
          user.phone || "",
          ACCESS_LEVEL_LABELS[accessLevel],
          ROLE_LABELS[user.role],
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [users, search],
  );

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-2xl">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-100 bg-red-50 text-red-700">
          <AlertCircle size={18} className="mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Accès refusé</p>
            <p className="text-sm">
              Seul un administrateur peut gérer les utilisateurs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl border border-green-200 bg-green-50 text-green-700">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
          <button
            onClick={openCreateAccount}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: settings.primary_color,
              color: "var(--color-on-primary)",
            }}
          >
            <UserPlus size={16} />
            Créer compte utilisateur
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
            Nouveau profil (UUID)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: settings.primary_color }}
            />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users size={42} className="opacity-30 mb-2" />
            <p className="text-sm">Aucun profil utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full egs-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Utilisateur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Poste
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Accès
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                    Département
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                    Téléphone
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  const accessLevel = normalizeAccessLevel(
                    user.access_level,
                    user.role,
                  );
                  const initials = user.full_name?.trim()
                    ? user.full_name.trim().charAt(0).toUpperCase()
                    : "?";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: settings.secondary_color,
                              }}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {user.full_name || "Sans nom"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {ROLE_LABELS[user.role]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {user.poste || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={ACCESS_LEVEL_LABELS[accessLevel]}
                          color={ACCESS_LEVEL_COLORS[accessLevel]}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        {user.department || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                        {user.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Créer compte utilisateur"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateAccount();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="utilisateur@domaine.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Minimum 8 caractères"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={createForm.full_name}
              onChange={(e) =>
                setCreateForm({ ...createForm, full_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Niveau d'accès *
              </label>
              <select
                value={createForm.access_level}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    access_level: e.target.value as AccessLevel,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {ACCESS_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {ACCESS_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={createForm.poste}
                onChange={(e) =>
                  setCreateForm({ ...createForm, poste: e.target.value })
                }
                placeholder="Secrétaire, Ouvrier, Chef de projet..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Département
              </label>
              <input
                type="text"
                value={createForm.department}
                onChange={(e) =>
                  setCreateForm({ ...createForm, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URL avatar (optionnel)
            </label>
            <input
              type="url"
              value={createForm.avatar_url}
              onChange={(e) =>
                setCreateForm({ ...createForm, avatar_url: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Shield size={14} />
              <span>
                Rôle technique généré:{" "}
                <strong>
                  {ROLE_LABELS[mapAccessLevelToRole(createForm.access_level)]}
                </strong>
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Si la création directe échoue, une invitation par email sera
              envoyée (l’utilisateur définira son mot de passe après
              activation).
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                creatingAccount ||
                !createForm.email.trim() ||
                !createForm.password.trim() ||
                !createForm.full_name.trim()
              }
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {creatingAccount ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingId
            ? "Modifier un utilisateur"
            : "Nouveau profil (UUID existant)"
        }
      >
        <div className="space-y-4">
          {!editingId ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                UUID utilisateur (auth.users) *
              </label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Le compte doit exister dans Supabase Auth avant la création du
                profil.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Identifiant utilisateur
              </p>
              <p className="text-xs font-mono text-gray-500 break-all bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                {form.id}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Niveau d'accès *
              </label>
              <select
                value={form.access_level}
                onChange={(e) =>
                  setForm({
                    ...form,
                    access_level: e.target.value as AccessLevel,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              >
                {ACCESS_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {ACCESS_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={form.poste}
                onChange={(e) => setForm({ ...form, poste: e.target.value })}
                placeholder="Secrétaire, Ouvrier, Chef de projet..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Département
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URL avatar (optionnel)
            </label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Shield size={14} />
              <span>
                Rôle technique généré:{" "}
                <strong>
                  {ROLE_LABELS[mapAccessLevelToRole(form.access_level)]}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.full_name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{
                backgroundColor: settings.primary_color,
                color: "var(--color-on-primary)",
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
