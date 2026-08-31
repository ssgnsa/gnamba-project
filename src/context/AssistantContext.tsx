/* eslint-disable react-refresh/only-export-components */
import {
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { assistantCore } from "../lib/assistant-egs";
import type { Agent, AgentMessage, AssistantContext, AgentAction } from "../lib/assistant-egs/types";
import { AssistantContext as AssistantContextValue } from "./AssistantContextValue";

export interface AssistantContextType {
  currentAgent: Agent | null;
  currentContext: AssistantContext | null;
  greeting: AgentMessage | null;
  recommendations: string[];
  anomalies: string[];
  actions: AgentAction[];
  isLoading: boolean;
  setContext(context: AssistantContext): Promise<void>;
  processQuery(query: string): Promise<AgentMessage>;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [currentContext, setCurrentContext] =
    useState<AssistantContext | null>(null);
  const [greeting, setGreeting] = useState<AgentMessage | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<string[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debugAssistant = import.meta.env.DEV;

  const handleSetContext = useCallback(async (context: AssistantContext) => {
    if (debugAssistant) {
      console.debug("AssistantContext.handleSetContext", { context });
    }
    setIsLoading(true);
    try {
      await assistantCore.setContext(context);
      setCurrentContext(context);
      setCurrentAgent(assistantCore.getCurrentAgent());

      // Fetch greeting and initial data
      const greetingData = await assistantCore.getGreeting();
      setGreeting(greetingData);

      const recs = await assistantCore.generateRecommendations();
      setRecommendations(recs);

      const anom = await assistantCore.detectAnomalies();
      setAnomalies(anom);

      const agentActions = await assistantCore.suggestActions();
      setActions(agentActions);
    } catch (error) {
      console.error("Error setting assistant context:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debugAssistant]);

  const handleProcessQuery = useCallback(
    async (query: string): Promise<AgentMessage> => {
      setIsLoading(true);
      try {
        return await assistantCore.processQuery(query);
      } catch (error) {
        console.error("Error processing query:", error);
        return {
          summary: "Une erreur s'est produite lors du traitement de votre demande.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      currentAgent,
      currentContext,
      greeting,
      recommendations,
      anomalies,
      actions,
      isLoading,
      setContext: handleSetContext,
      processQuery: handleProcessQuery,
    }),
    [
      currentAgent,
      currentContext,
      greeting,
      recommendations,
      anomalies,
      actions,
      isLoading,
      handleSetContext,
      handleProcessQuery,
    ],
  );

  return (
    <AssistantContextValue.Provider value={value}>
      {children}
    </AssistantContextValue.Provider>
  );
}

export function useAssistant(): AssistantContextType {
  const context = useContext(AssistantContextValue);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}