/**
 * 중앙화된 API 서비스
 * 모든 API 요청을 처리하고 httpOnly 쿠키 기반 인증을 사용
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * HTTP 요청 래퍼
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = config;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      credentials: requiresAuth ? 'include' : 'omit',
    });

    if (!response.ok) {
      let errorMessage = '요청 처리 중 오류가 발생했습니다.';
      let errorData;

      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      throw new ApiError(response.status, errorMessage, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, '네트워크 오류가 발생했습니다.');
  }
}

/**
 * API 메서드
 */
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  uploadFile: <T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ) => {
    const url = `${API_BASE_URL}${endpoint}`;

    return fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      ...config,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || '파일 업로드에 실패했습니다.',
          errorData
        );
      }
      return response.json() as Promise<T>;
    });
  },
};

export { ApiError };
export default api;
