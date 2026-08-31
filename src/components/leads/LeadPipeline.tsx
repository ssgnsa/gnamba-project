import { useState, useCallback } from "react";
import {
  Users,
  Target,
  Handshake,
  Award,
  XCircle,
  CheckCircle,
  Plus,
  Filter,
  Clock,
  Euro,
  Calendar,
  User,
} from "lucide-react";

import { calculateLeadScore, getTierConfig, LeadScoreBreakdown } from "../../lib/leadScoring";
import type { Lead, LeadStatus, PipelineStage as LeadPipelineStage } from "../../types";
import Badge from "../ui/Badge";

// Column configuration for the sales pipeline - aligned with PipelineStage type
const PIPELINE_COLUMNS: { id: LeadPipelineStage; label: string; icon: any; color: string }[] = [
  { id: "nouveau", label: "Nouveau", icon: Users, color: "bg-gray-100 text-gray-700 border-gray-200" },
  { id: "qualifie", label: "Qualifié", icon: Target, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "proposition", label: "Proposition", icon: Handshake, color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "negociation", label: "Négociation", icon: Award, color: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "gagne", label: "Gagné", icon: CheckCircle, color: "bg-green-100 text-green-700 border-green-300" },
  { id: "perdu", label: "Perdu", icon: XCircle, color: "bg-red-100 text-red-700 border-red-300" },
];

interface LeadPipelineProps {
  leads: Lead[];
  onLeadUpdate: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onLeadClick?: (lead: Lead) => void;
  className?: string;
}

export default function LeadPipeline({
  leads: initialLeads,
  onLeadUpdate,
  onLeadClick,
  className = "",
}: LeadPipelineProps) {
  const [columns] = useState(PIPELINE_COLUMNS);
  // Extended lead type for pipeline with computed fields
  type PipelineLead = Lead & {
    scoreBreakdown?: LeadScoreBreakdown;
    pipeline_stage: LeadPipelineStage;
  };

  const [leads, setLeads] = useState<PipelineLead[]>(() => 
    initialLeads.map(lead => ({
      ...lead,
      pipeline_stage: (lead.pipeline_stage || mapStatusToPipeline(lead.status)) as LeadPipelineStage,
      scoreBreakdown: calculateLeadScore(lead, {
        hoursSinceLastInteraction: lead.last_interaction_at 
          ? (Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60)
          : 9999,
      })
    }))
  );
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadPipelineStage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<LeadScoreBreakdown['tier'] | "">("");
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  // Group leads by pipeline stage
  const leadsByColumn = useCallback(() => {
    const grouped: Record<LeadPipelineStage, Lead[]> = {
      nouveau: [], qualifie: [], proposition: [], negociation: [], gagne: [], perdu: []
    };
    
    let filtered = leads;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.phone.includes(term) ||
        `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase().includes(term) ||
        (l.email || "").toLowerCase().includes(term)
      );
    }
    
    if (filterTier) {
      filtered = filtered.filter(l => (l as PipelineLead).scoreBreakdown?.tier === filterTier);
    }
    
    if (showOnlyAssigned) {
      filtered = filtered.filter(l => l.assigned_to);
    }
    
    filtered.forEach(lead => {
      const stage = lead.pipeline_stage || mapStatusToPipeline(lead.status);
      if (grouped[stage as LeadPipelineStage]) {
        grouped[stage as LeadPipelineStage].push(lead);
      } else {
        grouped.nouveau.push(lead);
      }
    });
    
    return grouped;
  }, [leads, searchTerm, filterTier, showOnlyAssigned]);

  const groupedLeads = leadsByColumn();

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: LeadPipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, columnId: LeadPipelineStage) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      if (dragOverColumn === columnId) {
        setDragOverColumn(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, columnId: LeadPipelineStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedLead) return;
    
    const newStage = columnId;
    const newStatus = mapPipelineToStatus(newStage);
    
    // Optimistic update
    setLeads(prev => prev.map(l => 
      l.id === draggedLead.id 
        ? { ...l, pipeline_stage: newStage, status: newStatus as LeadStatus }
        : l
    ));
    
    // Persist to backend
    try {
      await onLeadUpdate(draggedLead.id, { 
        pipeline_stage: newStage, 
        status: newStatus 
      });
    } catch (err) {
      // Revert on error
      setLeads(prev => prev.map(l => 
        l.id === draggedLead.id 
          ? { ...l, pipeline_stage: draggedLead.pipeline_stage as LeadPipelineStage, status: draggedLead.status }
          : l
      ));
      console.error("Failed to update lead stage:", err);
    }
    
    setDraggedLead(null);
  };

  const handleLeadClick = (lead: Lead) => {
    if (onLeadClick) {
      onLeadClick(lead);
    } else {
      setExpandedLead(expandedLead === lead.id ? null : lead.id);
    }
  };

  const getScoreBadge = (breakdown: LeadScoreBreakdown | undefined) => {
    if (!breakdown) return null;
    const config = getTierConfig(breakdown.tier);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color}`}>
        {config.emoji} {breakdown.total}
      </span>
    );
  };

  const getTierBadge = (breakdown: LeadScoreBreakdown | undefined) => {
    if (!breakdown) return null;
    const config = getTierConfig(breakdown.tier);
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${config.color.replace('100', '50').replace('700', '600')}`}>
        {config.emoji} {config.label}
      </span>
    );
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="">Tous les tiers</option>
          <option value="hot">🔥 Chaud</option>
          <option value="warm">🌡️ Tiède</option>
          <option value="cold">❄️ Froid</option>
          <option value="churned">💀 Perdu</option>
        </select>
        
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyAssigned}
            onChange={(e) => setShowOnlyAssigned(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Mes leads seulement
        </label>
      </div>

      {/* Pipeline Columns */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full items-start">
          {columns.map((column) => {
            const columnLeads = groupedLeads[column.id] || [];
            const isDragOver = dragOverColumn === column.id;
            
            return (
              <div
                key={column.id}
                className={`flex-shrink-0 w-72 md:w-80 h-full flex flex-col ${isDragOver ? "ring-2 ring-blue-500" : ""}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-3 rounded-t-xl border-b ${column.color.replace('text-', 'bg-').replace('700', '100')} border-slate-200 sticky top-0 z-10`}>
                  <div className="flex items-center gap-2">
                    <column.icon size={18} className={column.color.replace('bg-', 'text-').replace('100', '600').replace('700', '600')} />
                    <h3 className="font-semibold text-slate-800">{column.label}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.color}`}>
                    {columnLeads.length}
                  </span>
                </div>
                
                {/* Column Leads */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
                  {columnLeads.length === 0 ? (
                    <div className="text-center text-slate-400 py-8 text-xs">
                      Glissez un lead ici
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isDragging={draggedLead?.id === lead.id}
                        onClick={() => handleLeadClick(lead)}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        expanded={expandedLead === lead.id}
                        scoreBadge={getScoreBadge((lead as PipelineLead).scoreBreakdown)}
                        tierBadge={getTierBadge((lead as PipelineLead).scoreBreakdown)}
                      />
                    ))
                  )}
                </div>
                
                {/* Add Lead Button */}
                <button
                  className="w-full px-3 py-2 mt-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                  onClick={() => addNewLead(column.id)}
                >
                  <Plus size={16} /> Ajouter un lead
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  expanded: boolean;
  scoreBadge: React.ReactElement | null;
  tierBadge: React.ReactElement | null;
}

function LeadCard({ lead, isDragging, onClick, onDragStart, expanded, scoreBadge, tierBadge }: LeadCardProps) {
  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm p-3
        cursor-pointer transition-all duration-200
        ${isDragging ? "opacity-50 rotate-2 shadow-lg" : "hover:shadow-md hover:border-slate-300"}
        ${expanded ? "ring-2 ring-blue-500 shadow-lg" : ""}
      `}
      style={{ userSelect: 'none' }}
    >
      {/* Header with name and score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800 truncate">
            {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Sans nom"}
          </div>
          <div className="text-xs text-slate-500 truncate">📞 {lead.phone}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {scoreBadge}
          {tierBadge}
        </div>
      </div>
      
      {/* Email and source */}
      {(lead.email || lead.source) && (
        <div className="text-xs text-slate-500 space-y-1 mb-2">
          {lead.email && <div className="truncate">📧 {lead.email}</div>}
          {lead.source && <div className="truncate">📍 {lead.source}</div>}
        </div>
      )}
      
      {/* Channels */}
      <div className="flex gap-1 mb-2">
        {lead.channels_optin?.sms && <Badge label="SMS" color="blue" />}
        {lead.channels_optin?.whatsapp && <Badge label="WhatsApp" color="green" />}
        {lead.channels_optin?.email && <Badge label="Email" color="red" />}
        {lead.channels_optin?.telegram && <Badge label="Telegram" color="blue" />}
      </div>
      
      {/* Estimated value */}
      {lead.estimated_value && (
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
          <Euro size={12} /> Valeur: {lead.estimated_value.toLocaleString()} FCFA
        </div>
      )}
      
      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 pt-3 mt-3 space-y-2 text-xs">
          {lead.next_action && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={12} /> Prochaine action: {lead.next_action}
            </div>
          )}
          {lead.next_action_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={12} /> Prévu le: {new Date(lead.next_action_date).toLocaleDateString("fr-FR")}
            </div>
          )}
          {lead.assigned_to && (
            <div className="flex items-center gap-2 text-slate-600">
              <User size={12} /> Assigné à: {lead.assigned_to}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <Target size={12} /> Score: {lead.score_breakdown?.total || lead.score}/100
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function mapStatusToPipeline(status: string): LeadPipelineStage {
  const mapping: Record<string, LeadPipelineStage> = {
    "nouveau": "nouveau",
    "contacte": "nouveau",
    "qualifie": "qualifie",
    "proposition": "proposition",
    "negociation": "negociation",
    "converti": "gagne",
    "perdu": "perdu",
    "archive": "perdu",
    "active": "nouveau",
    "opted_out": "perdu",
    "converted": "gagne",
    "bounced": "perdu",
  };
  return mapping[status] || "nouveau";
}

function mapPipelineToStatus(stage: LeadPipelineStage): LeadStatus {
  const mapping: Record<LeadPipelineStage, string> = {
    "nouveau": "nouveau",
    "qualifie": "qualifie",
    "proposition": "proposition",
    "negociation": "negociation",
    "gagne": "converti",
    "perdu": "perdu",
  };
  return (mapping[stage] || "nouveau") as LeadStatus;
}

function addNewLead(columnId: LeadPipelineStage) {
  console.log("Add new lead to column:", columnId);
}
