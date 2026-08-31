import { useCallback, useState, useRef } from "react";
import { ollama, isOllamaEnabled } from "../lib/ollama";
import type { DashboardData } from "../types/dashboard";

interface UseAISummaryOptions {
  enabled?: boolean;
}

interface UseAISummaryReturn {
  summary: string | null;
  loading: boolean;
  error: string | null;
  generate: (data: DashboardData) => Promise<void>;
  clear: () => void;
}

/**
 * Hook to generate AI-powered financial summary
 */
export function useAISummary({ enabled = true }: UseAISummaryOptions = {}): UseAISummaryReturn {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useCallback(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const generate = useCallback(async (data: DashboardData) => {
    if (!enabled || !isOllamaEnabled) {
      setError("Ollama n'est pas activé ou non disponible");
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const prompt = ollama.createFinancialSummaryPrompt({
        revenues: data.monthly.map((m) => ({
          month: m.month,
          amount: m.recettes,
        })),
        expenses: data.monthly.map((m) => ({
          month: m.month,
          amount: m.depenses,
        })),
        projects: [
          { name: "Clients", status: `${data.totalClients} total`, budget: data.totalClients },
          { name: "Projets", status: `${data.projetsActifs} actifs` },
          { name: "Biens immobiliers", status: `${data.biensImmobiliers} biens` },
        ],
      });

      const result = await ollama.chat(
        [{ role: "user", content: prompt }],
        undefined,
        { temperature: 0.7, maxTokens: 800 }
      );

      // Can't easily cancel without signal support, but we can check if still relevant
      if (mountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setSummary(result);
      }
    } catch (err) {
      if (mountedRef.current && !abortControllerRef.current?.signal.aborted) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  const clear = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return { summary, loading, error, generate, clear };
}