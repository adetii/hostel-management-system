let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}