import axios from 'axios';

export class NvidiaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = '', baseUrl: string = 'https://api.nvidia.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chatCompletion(params: {
    model: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    maxTokens?: number;
    context?: { userId: string; role: string; tenant: string };
  }): Promise<{ id: string; choices: Array<{ message: { content: string } }>; usage: { total_tokens: number; completion_tokens: number; prompt_tokens: number } }> {
    const url = `${this.baseUrl}/chat/completions`;
    const payload = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1024,
      // NVIDIA may support additional fields like 'context' for retrieval
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.data;
  }
}
