export interface CreateUserEdgeFunctionHeadersOptions {
  anonKey: string;
  sessionToken?: string;
}

export function buildCreateUserEdgeFunctionHeaders({
  anonKey,
  sessionToken,
}: CreateUserEdgeFunctionHeadersOptions): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionToken || anonKey}`,
  };
}
