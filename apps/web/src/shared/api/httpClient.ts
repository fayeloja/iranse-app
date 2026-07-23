let accessTokenMemory: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

/**
 * Executes rotating refresh token exchanges on the backend (Identity Layer 1).
 * Deduplicates concurrent refresh requests using a shared promise buffer.
 */
export async function rotateToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/v1/identity/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Rotation session expired.');
      }
      const json = await res.json();
      const token = json.data.accessToken;
      setAccessToken(token);
      return token;
    } catch (err) {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Standardized HTTP API client wrapper.
 * Inject access tokens in memory and intercepts 401 response codes to execute
 * transparent OAuth2 refresh token rotation (Identity Layer 1).
 */
export async function httpClient(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  
  // Set json content type by default if sending body (excluding Blob/File/FormData)
  const isBinaryOrForm =
    (typeof Blob !== 'undefined' && options.body instanceof Blob) ||
    (typeof FormData !== 'undefined' && options.body instanceof FormData);

  if (options.body && !headers.has('Content-Type') && !isBinaryOrForm) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach access token from memory (never localStorage)
  if (accessTokenMemory) {
    headers.set('Authorization', `Bearer ${accessTokenMemory}`);
  }

  const fetchOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  const response = await fetch(path, fetchOptions);

  // Handle Token Expirations Interceptor (gated against login/refresh infinite loops)
  if (
    response.status === 401 &&
    path !== '/api/v1/identity/login' &&
    path !== '/api/v1/identity/refresh'
  ) {
    console.log('🔄 Access Token expired. Attempting sliding window rotation...');
    const rotatedToken = await rotateToken();
    if (rotatedToken) {
      headers.set('Authorization', `Bearer ${rotatedToken}`);
      const retryResponse = await fetch(path, { ...fetchOptions, headers });
      if (retryResponse.ok) {
        return retryResponse.json();
      }
      throw await retryResponse.json();
    } else {
      // Trigger global logouts on session terminations
      console.warn('❌ Session expired. Dispatching logout redirection event.');
      window.dispatchEvent(new Event('auth:logout'));
      throw { error: { message: 'Session expired. Please log in again.', status: 401 } };
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw errorBody;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return null;
}
export default httpClient;
