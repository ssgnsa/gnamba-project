import { createContext } from "react";
import type { AssistantContextType } from "./AssistantContext";

export const AssistantContext = createContext<AssistantContextType | undefined>(undefined);