export interface ApiSuccess<T> {
  data: T;
  error: null;
  status?: number;
}

export interface ApiError {
  data: null;
  error: string;
  status?: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

type QueryResultLike<T> = {
  data: T | null;
  error: unknown;
};

export function isSuccess<T>(result: ApiResult<T>): result is ApiSuccess<T> {
  return result.error === null;
}

export function toErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return "Erreur inconnue";
}

export function apiError(message: string, status = 500): ApiError {
  return { data: null, error: message, status };
}

export function fromQueryResult<T>(
  result: QueryResultLike<T>,
  fallbackMessage = "Erreur de requete",
): ApiResult<T | null> {
  if (result.error) {
    return apiError(toErrorMessage(result.error) || fallbackMessage);
  }
  return { data: result.data, error: null, status: 200 };
}