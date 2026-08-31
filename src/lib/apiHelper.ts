// Safe API Fetch Helper to prevent JSON parsing errors on non-JSON/HTML server responses (e.g. Vercel 404s)

export interface SafeFetchResult<T = any> {
  success: boolean;
  data: T | null;
  status: number;
  message?: string;
  isJson: boolean;
}

/**
 * Safely fetches an API endpoint and parses JSON without throwing SyntaxError
 * on HTML 404/500 pages (such as "The page could not be found...").
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!text || text.trim() === '') {
      return {
        success: res.ok,
        data: null,
        status: res.status,
        message: res.ok ? 'OK' : `Server error (${res.status})`,
        isJson: false
      };
    }

    const trimmed = text.trim();
    const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

    if (contentType.includes('application/json') || looksLikeJson) {
      try {
        const parsed = JSON.parse(trimmed) as T;
        return {
          success: res.ok && ((parsed as any)?.success !== false),
          data: parsed,
          status: res.status,
          message: (parsed as any)?.message,
          isJson: true
        };
      } catch {
        return {
          success: false,
          data: null,
          status: res.status,
          message: 'Received invalid JSON response from server.',
          isJson: false
        };
      }
    }

    // Response is HTML or plain text (e.g. Vercel 404 "The page could not be found")
    const snippet = trimmed.substring(0, 100).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      success: false,
      data: null,
      status: res.status,
      message: res.status === 404
        ? 'API endpoint not available on this host. Using local storage.'
        : `Server returned non-JSON response (${res.status}): ${snippet || 'Unknown error'}`,
      isJson: false
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      status: 0,
      message: err?.message || 'Network connection failed.',
      isJson: false
    };
  }
}
