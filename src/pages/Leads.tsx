import { useEffect, useState, useCallback, useMemo } from "react";
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

  XCircle,
  Filter,
  ArrowUpDown,
  Target,
  Flame,
  Droplets,
  Snowflake,
  Skull,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { leadsRepository, campaignsRepository, interactionsRepository, leadConversionRepository } from '../lib/dbClient.service';
import { 
  calculateLeadScore, 
  getTierConfig, 
  getHoursSinceLastInteraction,
  sortLeadsByScore,
  filterLeadsByTier,
  LeadScoreBreakdown,
  ScoringContext 
} from '../lib/leadScoring';
import Badge from "../components/ui/Badge";
import type { Lead, Campaign } from '../types';

interface LeadWithScore extends Lead {
  scoreBreakdown?: LeadScoreBreakdown;
}

export default function LeadsPage() {
  const { settings } = useSettings();
  const [leads, setLeads] = useState<LeadWithScore[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "leads" | "campaigns" | "analytics"
  >("leads");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterTier, setFilterTier] = useState<LeadScoreBreakdown['tier'] | "">("");
  const [search, setSearch] = useState("");
  const [sortByScore, setSortByScore] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [campaignNotice, setCampaignNotice] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    optedOut: 0,
    totalSent: 0,
    totalFailed: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    churned: 0,
  });
  const [selectedLead, setSelectedLead] = useState<LeadWithScore | null>(null);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, campaignsRes, interactionsRes] = await Promise.all([
        leadsRepository.getAll({ limit: 1000 }),
        campaignsRepository.getAll({ limit: 100 }),
        interactionsRepository.getAll({ limit: 1000 }),
      ]);

      const rawLeads = ((leadsRes.data as any)?.items || []) as Lead[];
      setLeads(rawLeads);
      setCampaigns(campaignsRes.data || []);

      const interactions = interactionsRes.data || [];
      
      // Calculate score breakdowns for stats
      const leadsWithScores = rawLeads.map(lead => ({
        ...lead,
        scoreBreakdown: calculateLeadScore(lead, {
          hoursSinceLastInteraction: getHoursSinceLastInteraction(lead.last_interaction_at),
        })
      }));

      const tierCounts = {
        hot: leadsWithScores.filter(l => l.scoreBreakdown?.tier === 'hot').length,
        warm: leadsWithScores.filter(l => l.scoreBreakdown?.tier === 'warm').length,
        cold: leadsWithScores.filter(l => l.scoreBreakdown?.tier === 'cold').length,
        churned: leadsWithScores.filter(l => l.scoreBreakdown?.tier === 'churned').length,
      };

      setStats({
        total: rawLeads.length,
        active: rawLeads.filter(l => l.status === "active").length,
        optedOut: rawLeads.filter(l => l.status === "opted_out").length,
        totalSent: interactions.filter((i: any) => i.status === "sent").length,
        totalFailed: interactions.filter((i: any) => i.status === "failed").length,
        ...tierCounts,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build scoring contexts for all leads
  const scoringContexts = useMemo(() => {
    const contexts = new Map<string, ScoringContext>();
    leads.forEach(lead => {
      contexts.set(lead.id, {
        hoursSinceLastInteraction: getHoursSinceLastInteraction(lead.last_interaction_at),
      });
    });
    return contexts;
  }, [leads]);

  // Apply filters and sorting
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // Status filter
    if (filterStatus) {
      result = result.filter(l => l.status === filterStatus);
    }

    // Channel filter
    if (filterChannel) {
      result = result.filter(l => l.channels_optin?.[filterChannel as keyof typeof l.channels_optin]);
    }

    // Tier filter
    if (filterTier) {
      result = filterLeadsByTier(result, filterTier, scoringContexts);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(l => 
        l.phone.includes(search) ||
        `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase().includes(searchLower) ||
        (l.email || "").toLowerCase().includes(searchLower)
      );
    }

    // Sort by score if enabled
    if (sortByScore) {
      result = sortLeadsByScore(result, scoringContexts);
    }

    return result;
  }, [leads, filterStatus, filterChannel, filterTier, search, sortByScore, scoringContexts]);

  const channelLabels: Record<string, string> = {
    sms: "SMS",
    whatsapp: "WhatsApp",
    email: "Email",
    telegram: "Telegram",
  };

  const statusLabels: Record<string, string> = {
    active: "actif",
    opted_out: "désabonné",
    converted: "converti",
    bounced: "rebond",
  };

  const tierLabels: Record<LeadScoreBreakdown['tier'], { label: string; icon: any; color: string }> = {
    hot: { label: 'Chaud', icon: Flame, color: 'text-red-600' },
    warm: { label: 'Tiède', icon: Droplets, color: 'text-orange-600' },
    cold: { label: 'Froid', icon: Snowflake, color: 'text-blue-600' },
    churned: { label: 'Perdu', icon: Skull, color: 'text-gray-600' },
  };

  const createSalesCampaign = async () => {
    if (filteredAndSortedLeads.length === 0) {
      setCampaignError(
        "Aucun lead ne correspond aux filtres actuels. Ajustez votre sélection avant de créer une campagne.",
      );
      return;
    }

    setCreatingCampaign(true);
    setCampaignError(null);
    setCampaignNotice(null);

    try {
      const now = new Date();
      const segmentSummary = [
        filterStatus
          ? `statut ${statusLabels[filterStatus] || filterStatus}`
          : "tous statuts",
        filterChannel
          ? `canal ${channelLabels[filterChannel] || filterChannel}`
          : "multi-canal",
        filterTier
          ? `tier ${tierLabels[filterTier].label}`
          : null,
        search.trim() ? `recherche "${search.trim()}"` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const campaignName = `Campagne ${channelLabels[filterChannel] || "Commerciale"} ${now.toLocaleDateString(
        "fr-FR",
        {
          day: "2-digit",
          month: "short",
        },
      )}`;

      const channels =
        filterChannel && channelLabels[filterChannel]
          ? [filterChannel]
          : ["whatsapp", "email", "sms"];

      const templateContent = {
        summary: segmentSummary,
        lead_count: filteredAndSortedLeads.length,
        audience_preview: filteredAndSortedLeads.slice(0, 25).map((lead) => ({
          id: lead.id,
          name:
            [lead.first_name, lead.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() || "Lead",
          phone: lead.phone,
          source: lead.source_page || lead.source_form || lead.source,
          score: lead.scoreBreakdown?.total || lead.score,
        })),
        whatsapp:
          "Bonjour, Gnamba Services vous accompagne sur vos projets en Côte d'Ivoire. Répondez à ce message pour recevoir un devis rapide ou une fiche projet.",
        sms: "Gnamba Services: demandez votre devis rapide pour BTP, immobilier ou foncier. Répondez OUI pour être rappelé.",
        email:
          "Gnamba Services vous propose un accompagnement rapide et local pour vos projets BTP, immobilier et foncier en Côte d'Ivoire.",
        facebook:
          "Nouvelle campagne Gnamba Services: des solutions claires et rapides pour vos projets BTP, immobilier et foncier en Côte d'Ivoire. Contactez-nous pour un devis.",
        instagram:
          "BTP, immobilier, foncier: un seul partenaire, un seul suivi, plus de réactivité. Demandez votre devis Gnamba Services.",
        linkedin:
          "Gnamba Services lance une campagne de vente ciblée pour accompagner les projets BTP, immobiliers et fonciers en Côte d'Ivoire.",
        call_to_action: "Demander un devis",
      };

      const { data, error } = await campaignsRepository.create({
        name: campaignName,
        description: `Campagne commerciale construite depuis le tableau de bord leads pour ${filteredAndSortedLeads.length} contact(s).`,
        channels,
        segment_filter: {
          status: filterStatus || null,
          channel: filterChannel || null,
          search: search.trim() || null,
          lead_count: filteredAndSortedLeads.length,
          tier: filterTier || null,
          source: "lead-dashboard",
        },
        template_content: templateContent,
        status: "draft",
      });

      if (error) throw error;

      setCampaignNotice(
        `Campagne brouillon créée avec succès: ${data?.name || campaignName}.`,
      );
      await fetchData();
    } catch (err) {
      setCampaignError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la campagne pour le moment.",
      );
    } finally {
      setCreatingCampaign(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    await leadsRepository.update(leadId, { status });
    fetchData();
  };

  const convertLeadToClient = async (lead: LeadWithScore) => {
    const clientData = {
      nom: lead.last_name || '',
      prenom: lead.first_name || '',
      telephone: lead.phone,
      email: lead.email || '',
      adresse: '',
      type_client: 'particulier' as const,
      notes: `Converti depuis lead ${lead.source} (score: ${lead.scoreBreakdown?.total || lead.score})`,
    };

    try {
      const result = await leadConversionRepository.convertToClient(lead.id, clientData);
      if (result.error) throw new Error(result.error);
      
      // Update lead status to converted
      await leadsRepository.update(lead.id, { status: 'converted' });
      fetchData();
      
      alert(`Lead converti en client avec succès !`);
    } catch (err) {
      alert(`Erreur lors de la conversion: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
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

  const getScoreBadge = (score: number, tier: LeadScoreBreakdown['tier']) => {
    const config = getTierConfig(tier);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>
        {config.emoji} {score}
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

  // Score Detail Modal
  if (showScoreDetail && selectedLead) {
    const breakdown = selectedLead.scoreBreakdown || calculateLeadScore(selectedLead, scoringContexts.get(selectedLead.id));
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Détail du Score</h3>
            <button onClick={() => { setShowScoreDetail(false); setSelectedLead(null); }} className="text-slate-400 hover:text-slate-600">
              <XCircle size={24} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getTierConfig(breakdown.tier).color.replace('bg-', 'text-').replace('100', '600')}`}>
                {breakdown.total}/100
              </div>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getTierConfig(breakdown.tier).color}`}>
                {getTierConfig(breakdown.tier).label}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'source', label: 'Source', value: breakdown.source, max: 30 },
                { key: 'channelEngagement', label: 'Engagement Canal', value: breakdown.channelEngagement, max: 20 },
                { key: 'recency', label: 'Récence', value: breakdown.recency, max: 20 },
                { key: 'frequency', label: 'Fréquence', value: breakdown.frequency, max: 15 },
                { key: 'profileCompleteness', label: 'Complétude Profil', value: breakdown.profileCompleteness, max: 10 },
                { key: 'pageDepth', label: 'Profondeur Navigation', value: breakdown.pageDepth, max: 5 },
              ].map((factor) => (
                <div key={factor.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{factor.label}</span>
                    <span className="font-medium text-slate-800">{factor.value}/{factor.max}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      style={{ width: `${Math.min(100, (factor.value / factor.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {breakdown.factors.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-2">Facteurs clés :</h4>
                <ul className="space-y-1 text-sm text-slate-600">
                  {breakdown.factors.map((factor, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
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
            Capture automatique, scoring intelligent, segmentation commerciale et relais multi-canal
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={createSalesCampaign}
            disabled={creatingCampaign || filteredAndSortedLeads.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} /> Créer campagne
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {(campaignNotice || campaignError) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            campaignError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {campaignError || campaignNotice}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Total Leads</div>
              <div className="text-lg font-bold text-slate-800">{stats.total}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <Flame size={20} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">🔥 Chauds</div>
              <div className="text-lg font-bold text-red-600">{stats.hot}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl">
              <Droplets size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">🌡️ Tièdes</div>
              <div className="text-lg font-bold text-orange-600">{stats.warm}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Snowflake size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">❄️ Froids</div>
              <div className="text-lg font-bold text-blue-600">{stats.cold}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-xl">
              <Skull size={20} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">💀 Perdus</div>
              <div className="text-lg font-bold text-gray-600">{stats.churned}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl">
              <Send size={20} className="text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Messages envoyés</div>
              <div className="text-lg font-bold text-teal-600">{stats.totalSent}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Échecs</div>
              <div className="text-lg font-bold text-amber-600">{stats.totalFailed}</div>
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
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
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
              <option value="bounced">Rebond</option>
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
              <option value="telegram">Telegram</option>
            </select>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Tous les tiers</option>
              <option value="hot">[Chaud] Chaud (70+)</option>
              <option value="warm">[Tiède] Tiède (40-69)</option>
              <option value="cold">[Froid] Froid (&lt;40)</option>
              <option value="churned">[Perdu] Perdu (inactif 30j+)</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={sortByScore}
                onChange={(e) => setSortByScore(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <ArrowUpDown size={14} className="text-slate-500" />
              Trier par score
            </label>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredAndSortedLeads.length === 0 ? (
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
                          <div className="flex items-center gap-1">
                            <Target size={14} className="text-slate-500" />
                            Score
                          </div>
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">
                          Tier
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
                      {filteredAndSortedLeads.map((lead) => {
                        const breakdown = lead.scoreBreakdown || calculateLeadScore(lead, scoringContexts.get(lead.id));
                        return (
                          <tr
                            key={lead.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            onClick={() => { setSelectedLead(lead); setShowScoreDetail(true); }}
                            style={{ cursor: 'pointer' }}
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
                                  <span title="SMS"><Smartphone size={14} className="text-blue-500" /></span>
                                )}
                                {lead.channels_optin?.whatsapp && (
                                  <span title="WhatsApp"><MessageCircle size={14} className="text-green-500" /></span>
                                )}
                                {lead.channels_optin?.email && (
                                  <span title="Email"><Mail size={14} className="text-red-500" /></span>
                                )}
                                {lead.channels_optin?.telegram && (
                                  <span title="Telegram"><Plane size={14} className="text-sky-500" /></span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(lead.status)}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700">
                              {getScoreBadge(breakdown.total, breakdown.tier)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierConfig(breakdown.tier).color}`}>
                                {getTierConfig(breakdown.tier).emoji} {getTierConfig(breakdown.tier).label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <select
                                  value={lead.status}
                                  onChange={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }}
                                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white"
                                >
                                  <option value="active">Actif</option>
                                  <option value="opted_out">Désabonné</option>
                                  <option value="converted">Converti</option>
                                  <option value="bounced">Rebond</option>
                                </select>
                                {lead.status === 'active' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); convertLeadToClient(lead); }}
                                    className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                  >
                                    Convertir en client
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden p-3 space-y-3">
                  {filteredAndSortedLeads.map((lead) => {
                    const breakdown = lead.scoreBreakdown || calculateLeadScore(lead, scoringContexts.get(lead.id));
                    return (
                      <div
                        key={lead.id}
                        className="p-4 bg-slate-50 rounded-xl space-y-2"
                        onClick={() => { setSelectedLead(lead); setShowScoreDetail(true); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">
                            {[lead.first_name, lead.last_name]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </span>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(lead.status)}
                            {getScoreBadge(breakdown.total, breakdown.tier)}
                          </div>
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
                          {lead.channels_optin?.telegram && (
                            <Badge label="Telegram" color="blue" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`px-2 py-0.5 rounded-full ${getTierConfig(breakdown.tier).color.replace('100', '50').replace('700', '600').replace('bg-', 'bg-').replace('text-', 'bg-')}`}>
                            {getTierConfig(breakdown.tier).emoji} {getTierConfig(breakdown.tier).label}
                          </span>
                          <span>Créé le {new Date(lead.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: Campaigns */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-blue-900">
                  Campagnes de vente multicanal
                </h3>
                <p className="text-sm text-blue-900/80 mt-1 max-w-3xl">
                  Créez un brief commercial à partir de vos filtres actuels et
                  préparez un relais cohérent entre SMS, WhatsApp, email et
                  réseaux sociaux.
                </p>
              </div>
              <button
                onClick={createSalesCampaign}
                disabled={creatingCampaign || filteredAndSortedLeads.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={15} />
                Créer un brouillon
              </button>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
              <Send size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune campagne pour le moment</p>
              <p className="text-xs mt-1">
                Créez un brouillon pour segmenter vos leads et préparer une
                séquence multicanal.
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
                    <Badge
                      key={ch}
                      label={channelLabels[ch] || ch}
                      color="blue"
                    />
                  ))}
                </div>
                {camp.segment_filter && (
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                    Filtre: {[
                      camp.segment_filter.status && `Statut: ${camp.segment_filter.status}`,
                      camp.segment_filter.channel && `Canal: ${camp.segment_filter.channel}`,
                      camp.segment_filter.tier && `Tier: ${camp.segment_filter.tier}`,
                      camp.segment_filter.search && `Recherche: "${camp.segment_filter.search}"`,
                      camp.segment_filter.lead_count && `${camp.segment_filter.lead_count} leads`,
                    ].filter(Boolean).join(' · ')}
                  </div>
                )}
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

          {/* Tier Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">
                🎯 Distribution par Tier (Scoring)
              </h3>
              {[
                { tier: 'hot' as const, label: '[Chaud] Chaud (70+)', color: 'bg-red-100 text-red-700' },
                { tier: 'warm' as const, label: '[Tiède] Tiède (40-69)', color: 'bg-orange-100 text-orange-700' },
                { tier: 'cold' as const, label: '[Froid] Froid (&lt;40)', color: 'bg-blue-100 text-blue-700' },
                { tier: 'churned' as const, label: '[Perdu] Perdu (inactif 30j+)', color: 'bg-gray-100 text-gray-700' },
              ].map(({ tier, label, color }) => {
                const count = stats[tier as keyof typeof stats] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={tier} className="py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600">{label}</span>
                      <span className="text-sm font-bold text-slate-800">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.replace('100', '600').replace('700', '600').replace('bg-', '').replace('text-', 'bg-')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">
                📈 Statistiques de Score
              </h3>
              {(() => {
                const scores = leads.map(l => l.scoreBreakdown?.total || l.score || 0).filter(s => s > 0);
                const avgScore = scores.length > 0 
                  ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
                  : 0;
                const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                const minScore = scores.length > 0 ? Math.min(...scores) : 0;
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-3xl font-bold text-slate-800">{avgScore}</div>
                      <div className="text-xs text-slate-500">Score Moyen</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-3xl font-bold text-slate-800">{maxScore}</div>
                      <div className="text-xs text-slate-500">Score Max</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-3xl font-bold text-slate-800">{minScore}</div>
                      <div className="text-xs text-slate-500">Score Min</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-3xl font-bold text-slate-800">{leads.length}</div>
                      <div className="text-xs text-slate-500">Leads Notés</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
