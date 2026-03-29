import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('calsnap-auth');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {}
    }
  }
  return config;
});

// Response interceptor: auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = localStorage.getItem('calsnap-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const res = await axios.post('/api/auth/refresh', {
              refreshToken: state.refreshToken,
            });
            const { accessToken, refreshToken } = res.data.data.tokens;
            // Update store
            const newState = { ...state, accessToken, refreshToken };
            localStorage.setItem(
              'calsnap-auth',
              JSON.stringify({ state: newState, version: 0 }),
            );
            original.headers.Authorization = `Bearer ${accessToken}`;
            return api(original);
          }
        }
      } catch {
        localStorage.removeItem('calsnap-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
