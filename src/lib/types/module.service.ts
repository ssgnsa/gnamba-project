export interface DiagnosticResult {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: number;
}

export interface ModuleService {
  name: string;
  healthCheck(): Promise<DiagnosticResult>;
}
