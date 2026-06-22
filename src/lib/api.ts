export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (body && (body.error === 'Invalid token' || body.error === 'Unauthorized: User not found')) {
        localStorage.removeItem('auth_token');
        window.location.reload();
      }
    } catch (e) {
      // Ignored
    }
  }

  return response;
}
