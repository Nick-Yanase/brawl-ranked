/** Códigos estáveis: o frontend decide pelo código, nunca pelo texto da mensagem. */
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "PROFILE_NOT_FOUND"
  | "PROFILE_EXISTS"
  | "SYNC_COOLDOWN"
  | "RATE_LIMITED"
  | "TAG_NOT_FOUND"
  | "GAME_MAINTENANCE"
  | "UPSTREAM_ERROR"
  | "INTERNAL";

/** Formato de toda resposta de erro da API. */
export type ApiErrorBody = { code: ErrorCode; error: string };

export const apiError = (code: ErrorCode, error: string): ApiErrorBody => ({ code, error });

/** Base dos erros com status HTTP: Supercell no backend, nossa API no frontend. */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = new.target.name; // aparece nos logs como "SupercellApiError", "ApiError"...
    this.status = status;
  }
}