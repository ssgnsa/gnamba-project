/**
 * Ollama Client Library
 * Provides AI capabilities via local Ollama instance
 * Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

export interface OllamaEmbedRequest {
  model: string;
  input: string;
}

export interface OllamaEmbedResponse {
  embeddings: number[][];
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

const isLocalHost = (host: string): boolean =>
  ["localhost", "127.0.0.1", "::1"].includes(host);

const shouldSkipLocalEndpoint = (baseUrl: string): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const target = new URL(baseUrl);
    const targetIsLocal = isLocalHost(target.hostname);
    const currentIsLocal = isLocalHost(window.location.hostname);
    return targetIsLocal && !currentIsLocal;
  } catch {
    return false;
  }
};

const defaultOllamaUrl =
  import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const runtimeAllowsEndpoint = !shouldSkipLocalEndpoint(defaultOllamaUrl);
export const isOllamaEnabled =
  import.meta.env.VITE_ENABLE_OLLAMA === "true" && runtimeAllowsEndpoint;

class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl =
      baseUrl || import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
    this.defaultModel =
      defaultModel || import.meta.env.VITE_OLLAMA_MODEL || "llama3.1:8b";
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    if (!isOllamaEnabled) return false;
    if (shouldSkipLocalEndpoint(this.baseUrl)) return false;
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    if (!isOllamaEnabled) {
      throw new Error(
        "L'assistant IA local est désactivé dans cet environnement.",
      );
    }
    if (shouldSkipLocalEndpoint(this.baseUrl)) {
      throw new Error(
        "L'assistant IA local n'est disponible que depuis l'environnement local.",
      );
    }
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`);
    }
    const data = await response.json();
    return data.models || [];
  }

  /**
   * Chat completion (non-streaming)
   */
  async chat(
    messages: OllamaMessage[],
    model?: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    if (!isOllamaEnabled) {
      throw new Error(
        "L'assistant IA local est désactivé dans cet environnement.",
      );
    }
    if (shouldSkipLocalEndpoint(this.baseUrl)) {
      throw new Error(
        "L'assistant IA local n'est disponible que depuis l'environnement local.",
      );
    }
    const request: OllamaChatRequest = {
      model: model || this.defaultModel,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 1000,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  }

  /**
   * Chat with streaming response
   */
  async *chatStream(
    messages: OllamaMessage[],
    model?: string,
    options?: { temperature?: number; maxTokens?: number },
  ): AsyncGenerator<string> {
    if (!isOllamaEnabled) {
      throw new Error(
        "L'assistant IA local est désactivé dans cet environnement.",
      );
    }
    if (shouldSkipLocalEndpoint(this.baseUrl)) {
      throw new Error(
        "L'assistant IA local n'est disponible que depuis l'environnement local.",
      );
    }
    const request: OllamaChatRequest = {
      model: model || this.defaultModel,
      messages,
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 1000,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Stream chat failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data: OllamaChatResponse = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) break;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  /**
   * Simple generate (single prompt)
   */
  async generate(
    prompt: string,
    system?: string,
    model?: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    if (!isOllamaEnabled) {
      throw new Error(
        "L'assistant IA local est désactivé dans cet environnement.",
      );
    }
    if (shouldSkipLocalEndpoint(this.baseUrl)) {
      throw new Error(
        "L'assistant IA local n'est disponible que depuis l'environnement local.",
      );
    }
    const request: OllamaGenerateRequest = {
      model: model || this.defaultModel,
      prompt,
      system,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 1000,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Generate failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Generate embeddings for semantic search
   */
  async embed(text: string, model?: string): Promise<number[]> {
    if (!isOllamaEnabled) {
      throw new Error(
        "L'assistant IA local est désactivé dans cet environnement.",
      );
    }
    if (shouldSkipLocalEndpoint(this.baseUrl)) {
      throw new Error(
        "L'assistant IA local n'est disponible que depuis l'environnement local.",
      );
    }
    const request: OllamaEmbedRequest = {
      model: model || "nomic-embed-text",
      input: text,
    };

    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Embed failed: ${response.statusText}`);
    }

    const data: OllamaEmbedResponse = await response.json();
    return data.embeddings[0] || [];
  }

  /**
   * Pre-built prompt for financial summarization
   */
  createFinancialSummaryPrompt(data: {
    revenues: Array<{ month: string; amount: number }>;
    expenses: Array<{ month: string; amount: number; category?: string }>;
    projects: Array<{ name: string; status: string; budget?: number }>;
  }): string {
    return `Tu es un assistant financier pour EGS (Enterprise Gnamba System), un ERP pour Gnamba Services en Côte d'Ivoire.

Génère un résumé financier en français (maximum 300 mots) basé sur les données suivantes:

**Recettes mensuelles:**
${data.revenues.map((r) => `- ${r.month}: ${r.amount.toLocaleString("fr-FR")} FCFA`).join("\n")}

**Dépenses mensuelles:**
${data.expenses.map((e) => `- ${e.month}: ${e.amount.toLocaleString("fr-FR")} FCFA${e.category ? ` (${e.category})` : ""}`).join("\n")}

**Projets:**
${data.projects.map((p) => `- ${p.name}: ${p.status}${p.budget ? ` - Budget: ${p.budget.toLocaleString("fr-FR")} FCFA` : ""}`).join("\n")}

Inclure:
1. Une analyse des tendances (augmentation/baisse des recettes et dépenses)
2. Les points d'attention (dépenses inhabituelles, projets en retard)
3. Des recommandations concrètes
4. Le bénéfice net estimé

Format: Texte structuré en paragraphes.`;
  }

  /**
   * Pre-built prompt for task prioritization
   */
  createTaskPriorityPrompt(task: {
    titre: string;
    description?: string;
    projet?: string;
    date_echeance?: string;
  }): string {
    return `Tu es un assistant de gestion de tâches pour EGS ERP.

Basé sur la tâche suivante, suggère une priorité (basse, normale, haute, urgente) et explique pourquoi.

**Titre:** ${task.titre}
${task.description ? `**Description:** ${task.description}` : ""}
${task.projet ? `**Projet associé:** ${task.projet}` : ""}
${task.date_echeance ? `**Date d'échéance:** ${task.date_echeance}` : ""}

Critères de priorité:
- **urgente**: Échéance dans moins de 24h, impact critique, client important
- **haute**: Échéance dans moins de 3 jours, impact significatif
- **normale**: Échéance dans la semaine, impact standard
- **basse**: Pas d'urgence, peut attendre

Réponds UNIQUEMENT avec ce format JSON:
{
  "priorite": "basse|normale|haute|urgente",
  "raison": "explication en français (max 100 mots)"
}`;
  }

  /**
   * Pre-built prompt for natural language query to database
   */
  createDatabaseQueryPrompt(question: string): string {
    return `Tu es un assistant qui traduit les questions en français vers des requêtes Supabase.

Question: "${question}"

Tables disponibles:
- clients (id, nom, email, telephone, entreprise)
- projets (id, nom, client_id, budget, statut, date_debut, date_fin)
- transactions (id, type, montant, categorie, date, projet_id, description)
- taches (id, titre, description, priorite, statut, date_echeance, projet_id)
- foncier_lots (id, code, localisation, superficie, prix, statut)
- immobilier_properties (id, nom, type, adresse, prix, statut)

Réponds UNIQUEMENT avec ce format JSON:
{
  "table": "nom_de_la_table",
  "query_description": "description de la requête en français",
  "filters": { "champ": "valeur" },
  "fields": ["champ1", "champ2"]
}`;
  }
}

// Singleton instance
export const ollama = new OllamaClient();

// Export class for custom instances
export { OllamaClient };
