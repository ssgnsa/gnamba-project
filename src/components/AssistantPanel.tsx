import { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useAssistant } from "../context/AssistantContext";
import { PAGE_TO_AGENT_ROLE } from "../lib/assistant-egs/types";
import type { Page } from "./Sidebar";

interface AssistantPanelProps {
  currentPage: Page;
}

export default function AssistantPanel({ currentPage }: AssistantPanelProps) {
  const {
    currentAgent,
    greeting,
    recommendations,
    anomalies,
    actions,
    isLoading,
    setContext,
  } = useAssistant();
  const [expanded, setExpanded] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"overview" | "alerts" | "actions">("overview");
  const renderCount = useRef(0);
  const debugAssistantPanel = import.meta.env.DEV;

  renderCount.current += 1;
  if (debugAssistantPanel) {
    console.debug("AssistantPanel render", {
      currentPage,
      renderCount: renderCount.current,
      currentAgent: currentAgent?.role,
    });
  }

  useEffect(() => {
    if (debugAssistantPanel) {
      console.debug("AssistantPanel setContext effect", { currentPage });
    }
    setContext({
      currentPage,
      currentRole: PAGE_TO_AGENT_ROLE[currentPage] ?? "admin",
    });
  }, [currentPage, setContext, debugAssistantPanel]);

  if (!currentAgent) {
    return null;
  }

  const bgColor =
    currentAgent.role === "infrastructure"
      ? "from-slate-600 to-slate-700"
      : currentAgent.role === "foncier"
        ? "from-emerald-600 to-teal-700"
        : currentAgent.role === "comptabilité"
          ? "from-blue-600 to-indigo-700"
          : "from-slate-500 to-slate-600";

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col z-30 transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className={`bg-gradient-to-r ${bgColor} p-4 text-white flex items-start justify-between`}>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{currentAgent.name}</h3>
          <p className="text-xs opacity-90 mt-1">{currentAgent.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white hover:bg-white/20 p-1 rounded transition"
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4 pt-3">
            <button
              onClick={() => setSelectedTab("overview")}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition ${
                selectedTab === "overview"
                  ? "border-slate-700 text-slate-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Aperçu
            </button>
            <button
              onClick={() => setSelectedTab("alerts")}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition relative ${
                selectedTab === "alerts"
                  ? "border-slate-700 text-slate-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Alertes
              {anomalies.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {anomalies.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("actions")}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition ${
                selectedTab === "actions"
                  ? "border-slate-700 text-slate-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Actions
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
              </div>
            ) : selectedTab === "overview" ? (
              <>
                {/* Greeting */}
                {greeting?.greeting && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-900">{greeting.greeting}</p>
                  </div>
                )}

                {/* Summary */}
                {greeting?.summary && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">{greeting.summary}</p>
                  </div>
                )}

                {/* Alerts */}
                {greeting?.alerts && greeting.alerts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Alertes immédiates
                    </p>
                    {greeting.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 p-2 bg-yellow-50 rounded border border-yellow-200 mb-2"
                      >
                        <AlertCircle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-900">{alert}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Recommandations
                    </p>
                    {recommendations.slice(0, 3).map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 p-2 bg-green-50 rounded border border-green-200 mb-2"
                      >
                        <Lightbulb size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-green-900">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : selectedTab === "alerts" ? (
              <>
                {anomalies.length > 0 ? (
                  anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 p-3 bg-red-50 rounded border border-red-200"
                    >
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-900">{anomaly}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2 p-3 bg-green-50 rounded border border-green-200">
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">Aucune alerte détectée</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => action.action()}
                      className={`w-full p-3 rounded border text-left transition ${
                        action.variant === "primary"
                          ? "bg-slate-700 text-white border-slate-800 hover:bg-slate-800"
                          : action.variant === "destructive"
                            ? "bg-red-50 text-red-900 border-red-200 hover:bg-red-100"
                            : "bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Zap
                          size={14}
                          className={action.variant === "primary" ? "text-white" : ""}
                        />
                        <div>
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="text-xs opacity-75">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune action suggérée</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
