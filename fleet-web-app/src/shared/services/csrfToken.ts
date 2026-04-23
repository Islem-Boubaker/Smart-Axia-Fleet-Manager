let csrfToken: string | null = null;

export function setCsrfToken(token: unknown): void {
  if (typeof token !== 'string') return;
  const trimmed = token.trim();
  csrfToken = trimmed.length > 0 ? trimmed : null;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}
