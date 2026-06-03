/** Backend origin without trailing slash; empty in dev (Vite proxies /api). */
export const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}
