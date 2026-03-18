/**
 * 중앙화된 API 서비스
 * 모든 API 요청을 처리하고 인증 토큰을 자동으로 추가
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
 * 인증 토큰 가져오기
 */
function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
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

  // 인증이 필요한 경우 토큰 추가
  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });

    // 응답이 성공적이지 않으면 에러 처리
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

    // 204 No Content 응답 처리
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
  /**
   * GET 요청
   */
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  /**
   * POST 요청
   */
  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT 요청
   */
  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH 요청
   */
  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE 요청
   */
  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  /**
   * 파일 업로드
   */
  uploadFile: <T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ) => {
    const { requiresAuth = true, ...rest } = config || {};
    const headers: Record<string, string> = {};

    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;

    return fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      ...rest,
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
