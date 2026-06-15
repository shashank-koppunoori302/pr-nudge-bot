const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const basePath = isLocal
  ? ''
  : (() => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      return parts.length >= 2 ? `/_api/app/${parts[1]}` : '';
    })();

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${basePath}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  put: (path: string, body?: unknown) => request('PUT', path, body),
  delete: (path: string) => request('DELETE', path),
};
