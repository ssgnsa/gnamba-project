import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Send,
  BarChart3,
  RefreshCw,
  Mail,
  Smartphone,
  MessageCircle,
  Plane,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSettings } from "../context/SettingsContext";
import Badge from "../components/ui/Badge";

interface Lead {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  source: string;
  source_page: string | null;
  source_form: string | null;
  status: string;
  channels_optin: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    telegram: boolean;
  };
  tags: string[];
  score: number;
  created_at: string;
  last_interaction_at: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  channels: string[];
  stats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    opted_out: number;
  };
  created_at: string;
}

export default function LeadsPage() {
  const { settings } = useSettings();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "leads" | "campaigns" | "analytics"
  >("leads");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    optedOut: 0,
    totalSent: 0,
    totalFailed: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, campaignsRes, interactionsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("lead_campaigns")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("lead_interactions").select("status"),
      ]);

      setLeads(leadsRes.data || []);
      setCampaigns(campaignsRes.data || []);

      const interactions = interactionsRes.data || [];
      setStats({
        total: leadsRes.data?.length || 0,
        active:
          leadsRes.data?.filter((l: Lead) => l.status === "active").length || 0,
        optedOut:
          leadsRes.data?.filter((l: Lead) => l.status === "opted_out").length ||
          0,
        totalSent: interactions.filter((i: any) => i.status === "sent").length,
        totalFailed: interactions.filter((i: any) => i.status === "failed")
          .length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLeads = leads.filter((l) => {
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchChannel =
      !filterChannel ||
      l.channels_optin?.[filterChannel as keyof typeof l.channels_optin];
    const matchSearch =
      !search ||
      l.phone.includes(search) ||
      `${l.first_name || ""} ${l.last_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchChannel && matchSearch;
  });

  const updateLeadStatus = async (leadId: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", leadId);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      active: { label: "Actif", color: "bg-green-100 text-green-700" },
      opted_out: { label: "Désabonné", color: "bg-red-100 text-red-700" },
      converted: { label: "Converti", color: "bg-blue-100 text-blue-700" },
      bounced: { label: "Rebond", color: "bg-yellow-100 text-yellow-700" },
    };
    const c = config[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        {c.label}
      </span>
    );
  };

  const getCampaignStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      draft: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
      scheduled: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
      running: { label: "En cours", color: "bg-green-100 text-green-700" },
      completed: { label: "Terminé", color: "bg-emerald-100 text-emerald-700" },
      paused: { label: "En pause", color: "bg-yellow-100 text-yellow-700" },
    };
    const c = config[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        {c.label}
      </span>
    );
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: settings.primary_color }}
        ></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            📢 Gestion des Leads & Campagnes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Capture automatique + Bot multi-canal autonome
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Total Leads</div>
              <div className="text-lg font-bold text-slate-800">
                {stats.total}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Actifs</div>
              <div className="text-lg font-bold text-green-600">
                {stats.active}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Désabonnés</div>
              <div className="text-lg font-bold text-red-600">
                {stats.optedOut}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl">
              <Send size={20} className="text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Messages envoyés</div>
              <div className="text-lg font-bold text-teal-600">
                {stats.totalSent}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Échecs</div>
              <div className="text-lg font-bold text-amber-600">
                {stats.totalFailed}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: "leads", label: "📋 Leads", icon: Users },
          { key: "campaigns", label: "📢 Campagnes", icon: Send },
          { key: "analytics", label: "📊 Analytiques", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-white text-slate-800 border-b-2 border-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Leads */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="opted_out">Désabonnés</option>
              <option value="converted">Convertis</option>
            </select>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Tous les canaux</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Users size={40} className="mb-2 opacity-30" />
                <p className="text-sm">Aucun lead trouvé</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Nom / Téléphone
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Source
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Canaux
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Statut
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Score
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {[lead.first_name, lead.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {lead.email || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {lead.source_form || lead.source_page || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {lead.channels_optin?.sms && (
                                <Smartphone
                                  size={14}
                                  className="text-blue-500"
                                />
                              )}
                              {lead.channels_optin?.whatsapp && (
                                <MessageCircle
                                  size={14}
                                  className="text-green-500"
                                />
                              )}
                              {lead.channels_optin?.email && (
                                <Mail size={14} className="text-red-500" />
                              )}
                              {lead.channels_optin?.telegram && (
                                <Plane size={14} className="text-sky-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(lead.status)}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">
                            {lead.score}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(lead.created_at).toLocaleDateString(
                              "fr-FR",
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                updateLeadStatus(lead.id, e.target.value)
                              }
                              className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="active">Actif</option>
                              <option value="opted_out">Désabonné</option>
                              <option value="converted">Conversi</option>
                              <option value="bounced">Rebond</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden p-3 space-y-3">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 bg-slate-50 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          {[lead.first_name, lead.last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </span>
                        {getStatusBadge(lead.status)}
                      </div>
                      <div className="text-sm text-slate-600">
                        📞 {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="text-sm text-slate-600">
                          📧 {lead.email}
                        </div>
                      )}
                      <div className="flex gap-1">
                        {lead.channels_optin?.sms && (
                          <Badge label="SMS" color="blue" />
                        )}
                        {lead.channels_optin?.whatsapp && (
                          <Badge label="WhatsApp" color="green" />
                        )}
                        {lead.channels_optin?.email && (
                          <Badge label="Email" color="red" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: Campaigns */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
              <Send size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune campagne pour le moment</p>
              <p className="text-xs mt-1">
                Les workflows automatiques sont configurés dans bot_workflows
              </p>
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{camp.name}</h3>
                  {getCampaignStatusBadge(camp.status)}
                </div>
                <div className="flex gap-2">
                  {(camp.channels || []).map((ch: string) => (
                    <Badge key={ch} label={ch} color="blue" />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[
                    {
                      label: "Envoyés",
                      value: camp.stats?.sent || 0,
                      color: "text-teal-600",
                    },
                    {
                      label: "Livrés",
                      value: camp.stats?.delivered || 0,
                      color: "text-blue-600",
                    },
                    {
                      label: "Lus",
                      value: camp.stats?.read || 0,
                      color: "text-purple-600",
                    },
                    {
                      label: "Échecs",
                      value: camp.stats?.failed || 0,
                      color: "text-red-600",
                    },
                    {
                      label: "Opt-out",
                      value: camp.stats?.opted_out || 0,
                      color: "text-amber-600",
                    },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500">
                  Créé le{" "}
                  {new Date(camp.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">
                📊 Sources des Leads
              </h3>
              {(() => {
                const sources: Record<string, number> = {};
                leads.forEach((l) => {
                  const src = l.source_form || l.source_page || "direct";
                  sources[src] = (sources[src] || 0) + 1;
                });
                return Object.entries(sources)
                  .sort((a, b) => b[1] - a[1])
                  .map(([src, count]) => (
                    <div
                      key={src}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-sm text-slate-600">{src}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {count}
                      </span>
                    </div>
                  ));
              })()}
            </div>

            {/* Channel Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">
                📱 Canaux Opt-in
              </h3>
              {[
                {
                  label: "SMS",
                  key: "sms",
                  icon: Smartphone,
                  color: "text-blue-600",
                },
                {
                  label: "WhatsApp",
                  key: "whatsapp",
                  icon: MessageCircle,
                  color: "text-green-600",
                },
                {
                  label: "Email",
                  key: "email",
                  icon: Mail,
                  color: "text-red-600",
                },
                {
                  label: "Telegram",
                  key: "telegram",
                  icon: Plane,
                  color: "text-sky-600",
                },
              ].map((ch) => {
                const count = leads.filter(
                  (l) =>
                    l.channels_optin?.[ch.key as keyof typeof l.channels_optin],
                ).length;
                const pct =
                  leads.length > 0
                    ? Math.round((count / leads.length) * 100)
                    : 0;
                return (
                  <div
                    key={ch.key}
                    className="py-2 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ch.icon size={16} className={ch.color} />
                        <span className="text-sm text-slate-600">
                          {ch.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-slate-800"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
