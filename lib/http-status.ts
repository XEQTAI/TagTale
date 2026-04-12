/** Map errors thrown by `requireAuth` / `requireAdmin` to HTTP status codes. */
export function httpStatusFromAuthError(message: string): number {
  if (message === 'Unauthorized') return 401
  if (message === 'Forbidden') return 403
  return 500
}
