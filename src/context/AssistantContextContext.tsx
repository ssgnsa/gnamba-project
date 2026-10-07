import { createContext, type Context } from "react";
import type { AssistantContextType } from "./AssistantContext";

export const AssistantContext: Context<AssistantContextType | undefined> = createContext<
  AssistantContextType | undefined
>(undefined);