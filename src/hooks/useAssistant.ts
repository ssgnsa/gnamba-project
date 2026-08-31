import { useContext } from "react";
import { AssistantContext } from "../context/AssistantContextContext";
import type { AssistantContextType } from "../context/AssistantContext";

export function useAssistant(): AssistantContextType {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}