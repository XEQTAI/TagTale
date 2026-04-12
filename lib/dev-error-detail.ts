/** Only include raw error text in API JSON when debugging locally — never in production. */
export function maybeDevDetail(err: unknown): { detail?: string } {
  if (process.env.NODE_ENV === 'development') {
    return { detail: String(err) }
  }
  return {}
}
