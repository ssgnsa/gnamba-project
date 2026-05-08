import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { isOllamaEnabled, ollama, OllamaMessage } from "../lib/ollama";

interface ChatMessage extends OllamaMessage {
  timestamp: Date;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Résumé financier",
    prompt:
      "Génère un résumé financier basé sur les données du tableau de bord",
    icon: "💰",
  },
  {
    label: "Tâches urgentes",
    prompt: "Quelles sont les tâches urgentes ou en retard?",
    icon: "⚡",
  },
  {
    label: "Projets en cours",
    prompt: "Liste les projets BTP en cours avec leur statut",
    icon: "🏗️",
  },
  {
    label: "Aide EGS",
    prompt: "Comment utiliser EGS? Explique les fonctionnalités principales",
    icon: "❓",
  },
];

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Ollama availability
  useEffect(() => {
    if (!isOllamaEnabled) {
      setOllamaAvailable(false);
      return;
    }
    ollama
      .isAvailable()
      .then(setOllamaAvailable)
      .catch(() => setOllamaAvailable(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim();
      if (!text || isLoading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      // Add a placeholder assistant message for streaming
      const assistantTimestamp = new Date();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          timestamp: assistantTimestamp,
        },
      ]);

      try {
        const allMessages: OllamaMessage[] = [
          {
            role: "system",
            content: `Tu es EGS Copilot, un assistant intelligent pour EGS (Enterprise Gnamba System), un ERP complet pour Gnamba Services en Côte d'Ivoire.

Tes responsabilités:
- Aider les utilisateurs à naviguer et utiliser EGS
- Fournir des analyses et résumés des données
- Répondre aux questions sur la gestion de projets BTP, l'immobilier, le foncier, la finance, etc.
- Toujours répondre en français de manière professionnelle et utile

Si tu ne connais pas la réponse, dis-le honnêtement et suggère où l'utilisateur pourrait trouver l'information.`,
          },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant" | "system",
            content: m.content,
          })),
          { role: "user", content: text },
        ];

        let responseText = "";

        // Use streaming for better UX
        for await (const chunk of ollama.chatStream(allMessages)) {
          responseText += chunk;
          // Update the last (assistant) message with accumulated content
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: responseText,
              };
            }
            return newMessages;
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(`Impossible de contacter Ollama: ${errorMessage}`);
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (
            lastIndex >= 0 &&
            newMessages[lastIndex].role === "assistant" &&
            !newMessages[lastIndex].content
          ) {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content:
                "❌ Désolé, je ne peux pas répondre pour le moment. Vérifie qu'Ollama est bien démarré sur ton système.",
            };
          } else {
            newMessages.push({
              role: "assistant",
              content:
                "❌ Désolé, je ne peux pas répondre pour le moment. Vérifie qu'Ollama est bien démarré sur ton système.",
              timestamp: new Date(),
            });
          }
          return newMessages;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOllamaEnabled) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 p-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 group"
        title="EGS Copilot - Assistant IA"
      >
        <MessageCircle
          size={24}
          className="group-hover:rotate-12 transition-transform"
        />
        {ollamaAvailable === false && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles size={24} className="animate-pulse" />
            {ollamaAvailable === true && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm">EGS Copilot</h3>
            <p className="text-xs text-white/80">
              {ollamaAvailable === null && "Vérification..."}
              {ollamaAvailable === true && "IA active"}
              {ollamaAvailable === false && "IA indisponible"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Ollama not available warning */}
      {ollamaAvailable === false && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={16}
              className="text-amber-600 mt-0.5 flex-shrink-0"
            />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Ollama n'est pas détecté</p>
              <p className="text-amber-700 dark:text-amber-300">
                Pour utiliser le Copilot, installez Ollama:{" "}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                  ollama pull llama3.1:8b
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
            💡 Actions rapides
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading || ollamaAvailable === false}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg mb-1 block">{action.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles size={48} className="mx-auto mb-3 text-primary/50" />
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Bonjour! Je suis EGS Copilot
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Posez-moi une question ou utilisez une action rapide
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const messageId = `${idx}-${msg.timestamp.getTime()}`;

          return (
            <div
              key={idx}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${isUser ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700"} rounded-2xl px-4 py-3 relative group`}
              >
                {!isUser && (
                  <button
                    onClick={() => copyToClipboard(msg.content, messageId)}
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Copier"
                  >
                    {copiedId === messageId ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} className="text-gray-500" />
                    )}
                  </button>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${isUser ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {msg.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2
                  size={16}
                  className="animate-spin text-gray-600 dark:text-gray-300"
                />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Réflexion...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Posez votre question..."
            disabled={isLoading || ollamaAvailable === false}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || ollamaAvailable === false}
            className="px-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Alimenté par Ollama • Les réponses peuvent contenir des erreurs
        </p>
      </div>
    </div>
  );
}
