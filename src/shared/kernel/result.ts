export type AppError = {
  code: string
  message: string
}

export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err(code: string, message: string): Result<never> {
  return { ok: false, error: { code, message } }
}
