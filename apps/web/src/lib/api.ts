let tokenGetter: (() => Promise<string | null>) | undefined;
export function setTokenGetter(getter: () => Promise<string | null>) { tokenGetter = getter; }

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public retryAfter?: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = await tokenGetter?.();
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch('/api' + path, { ...init, headers, credentials: 'include' });
  const payload = await response.json().catch(() => null) as { data?: T; error?: { code: string; message: string } } | null;
  if (!response.ok || !payload || payload.error || !('data' in payload)) {
    throw new ApiError(payload?.error?.message ?? 'We could not reach Sentinel. Please try again in a moment.', response.status, payload?.error?.code ?? 'NETWORK_ERROR', response.headers.get('Retry-After') ?? undefined);
  }
  return payload.data as T;
}

export function post<T>(path: string, data: unknown) {
  return api<T>(path, { method: 'POST', body: JSON.stringify(data) });
}
