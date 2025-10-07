const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function isRetryableError(status?: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

async function doFetch<T>(
  path: string,
  method: HttpMethod,
  body?: any,
  headers?: Record<string, string>
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'error' in data 
      ? (data.error as string) 
      : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, data);
  }
  
  return data as T;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, headers }: { 
    method?: HttpMethod; 
    body?: any; 
    headers?: Record<string, string> 
  } = {}
): Promise<T> {
  // Retry logic: 1 retry on 502/503/504
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await doFetch<T>(path, method, body, headers);
    } catch (e) {
      const isLastAttempt = attempt === 1;
      const shouldRetry = e instanceof ApiError && isRetryableError(e.status);
      
      if (isLastAttempt || !shouldRetry) {
        throw e;
      }
      
      // Wait 500ms before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new ApiError('Request failed after retries', 500);
}

