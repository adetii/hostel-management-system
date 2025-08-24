import axios from 'axios';
import { getCsrfToken } from '@/utils/csrf';
import { getOrCreateTabId } from '@/utils/tabId';
import toast from 'react-hot-toast';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';

// Create base API instance
const createApiInstance = () => {
  const tabId = getOrCreateTabId();
  
  return axios.create({
    baseURL: (import.meta.env.VITE_API_BASE_URL || '/api') + `/tab/${tabId}`,
    withCredentials: true
  });
};

// Create initial API instance
let api = createApiInstance();

// Prevent duplicate session-timeout toasts/redirects
let isHandlingAuth401 = false;

// Function to refresh API instance with new tab ID (for re-initialization)
export const refreshApiInstance = () => {
  api = createApiInstance();
  return api;
};

// Request interceptor: attach CSRF for state-changing methods
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

// Session-based response handling - no token refresh needed
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Skip redirect for hydration/explicitly-marked requests
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();
      const headers = error.config?.headers || {};
      const hasSkipHeader =
        headers['X-Skip-Auth-Redirect'] === 'true' || headers['x-skip-auth-redirect'] === 'true';
      const isHydrationRequest = url.includes('/auth/csrf-token') && method === 'get';
      if (hasSkipHeader || isHydrationRequest) {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      const isAuthPage =
        path === '/management/login' ||
        path === '/management/register' ||
        path === '/management/forgot-password' ||
        path === '/management/reset-password';

      if (!isAuthPage) {
        if (!isHandlingAuth401) {
          isHandlingAuth401 = true;
          // Clear any existing toasts and show a single session-timeout toast for ~5s
          toast.dismiss();
          toast.error('Session timeout, login again', { id: 'session-timeout', duration: 5000 });
          // Delay redirect slightly so the toast is visible before navigation
          setTimeout(() => {
            window.location.href = '/management/login';
          }, 1200);
        }
        return Promise.reject(error);
      }
    }
    
    // Handle emergency lockdown 503 errors
    if (error.response?.status === 503 && error.response?.data?.emergencyLockdown) {
    
      // Force logout the user
      store.dispatch(logout());
      
      // Show emergency lockdown message
      toast.error('Emergency lockdown activated. You have been logged out for security reasons. Please try again later.', {
        duration: 8000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: '500',
        },
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/management/login';
      }, 2000);
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Lightweight in-memory cache for GET requests
type CacheEntry = { expiry: number; data: any };
const responseCache = new Map<string, CacheEntry>();

function normalizePath(url: string): string {
  try {
    // url may be relative like "/tab/xxxx/rooms"
    const base = api.defaults.baseURL || '';
    const full = new URL(url, window.location.origin + base.replace(/^\/+/, '/'));
    // Strip "/tab/{id}" segment to normalize keys across sessions
    const path = full.pathname.replace(/\/tab\/[^/]+/i, '');
    const search = full.search || '';
    return path + search;
  } catch {
    // Fallback if URL parsing fails
    return url.replace(/\/tab\/[^/]+/i, '');
  }
}

function makeCacheKey(url: string, params?: any): string {
  const norm = normalizePath(url);
  const p = params ? JSON.stringify(params) : '';
  return `${norm}|${p}`;
}

// TTLs aligned with backend categories (in seconds)
const TTL_SECONDS = {
  room_details: 60,
  room_availability: 30,
  room_occupants: 30,
  booking_history: 30,
  user_lists: 60,
  user_profiles: 60,
  settings: 120,
  public_content: 300
};

function getTTLForPath(path: string): number | null {
  // order matters: match more specific first
  if (/^\/rooms\/\d+\/occupants$/i.test(path)) return TTL_SECONDS.room_occupants;
  if (/^\/rooms\/available$/i.test(path)) return TTL_SECONDS.room_availability;
  if (/^\/rooms\/\d+$/i.test(path)) return TTL_SECONDS.room_details;
  if (/^\/rooms$/i.test(path)) return TTL_SECONDS.room_details;

  if (/^\/bookings(\/\d+)?$/i.test(path)) return TTL_SECONDS.booking_history;

  if (/^\/students\/\d+\/bookings$/i.test(path)) return TTL_SECONDS.booking_history;
  if (/^\/students\/\d+$/i.test(path)) return TTL_SECONDS.user_profiles;
  if (/^\/students$/i.test(path)) return TTL_SECONDS.user_lists;

  if (/^\/settings\/public$/i.test(path)) return TTL_SECONDS.settings;
  if (/^\/settings$/i.test(path)) return TTL_SECONDS.settings;

  // Match public content routes: /public/content/:type
  if (/^\/public\/content\/[^/]+$/i.test(path)) return TTL_SECONDS.public_content;
  return null;
}

function setCache(key: string, data: any, ttlSec: number) {
  responseCache.set(key, { data, expiry: Date.now() + ttlSec * 1000 });
}

function getCache<T = any>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function invalidateByPath(path: string) {
  // invalidate groups based on path
  const patterns: Array<RegExp> = [];

  if (/^\/rooms(\/|$)/i.test(path)) {
    patterns.push(/^\/rooms/i);
    patterns.push(/^\/rooms\/\d+\/occupants/i);
  }
  if (/^\/bookings(\/|$)/i.test(path)) {
    patterns.push(/^\/bookings/i);
    patterns.push(/^\/students\/\d+\/bookings/i);
    patterns.push(/^\/rooms\/\d+\/occupants/i);
    patterns.push(/^\/students\/\d+$/i);
    patterns.push(/^\/students$/i);
  }
  if (/^\/students(\/|$)/i.test(path)) {
    patterns.push(/^\/students/i);
    patterns.push(/^\/students\/\d+\/bookings/i);
    patterns.push(/^\/students\/\d+$/i); // Ensure individual student data is invalidated
  }
  if (/^\/settings(\/|$)/i.test(path)) {
    patterns.push(/^\/settings/i);
  }
  // Admin content writes affect public content; invalidate both admin and public content caches
  if (/^\/super-admin\/content(\/|$)/i.test(path)) {
    patterns.push(/^\/public\/content/i);
    patterns.push(/^\/super-admin\/content/i);
  }

  // Invalidate public content cache keys
  if (/^\/public\/content(\/|$)/i.test(path)) {
    patterns.push(/^\/public\/content/i);
  }

  if (patterns.length === 0) return;

  for (const key of responseCache.keys()) {
    const [cachedPath] = key.split('|');
    if (patterns.some((re) => re.test(cachedPath))) {
      console.log(`Invalidating cache key: ${key}`); // Debug log
      responseCache.delete(key);
    }
  }
}

// Export a helper to invalidate settings caches on this tab (used by socket listeners)
export function invalidateSettingsCache() {
  try {
    invalidateByPath('/settings');
    invalidateByPath('/settings/public');
  } catch {
    // no-op
  }
}

// On write responses, invalidate relevant cache entries
api.interceptors.response.use((response) => {
  try {
    const method = (response.config?.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const path = normalizePath(response.config?.url || '');
      invalidateByPath(path);
    } else if (method === 'get') {
      // Populate cache when allowed
      const path = normalizePath(response.config?.url || '');
      const ttl = getTTLForPath(path);
      const bypass = response.config?.headers?.['X-Bypass-Cache'] === 'true' || response.config?.headers?.['x-bypass-cache'] === 'true';
      if (ttl && !bypass) {
        const key = makeCacheKey(response.config?.url || '', response.config?.params);
        setCache(key, response.data, ttl);
      }
    }
  } catch {
    // no-op on caching failures
  }
  return response;
});

// Public helper for GET with cache
export async function cachedGet<T = any>(url: string, config?: any): Promise<{ data: T }> {
  const path = normalizePath(url);
  const ttl = getTTLForPath(path);
  const bypass = config?.headers?.['X-Bypass-Cache'] === 'true' || config?.headers?.['x-bypass-cache'] === 'true';
  const key = makeCacheKey(url, config?.params);

  if (ttl && !bypass) {
    const cached = getCache<{ data: T }>(key);
    if (cached) {
      return { data: cached as T };
    }
  }
  // Fallback to network; response interceptor will store it
  const resp = await api.get<T>(url, config);
  return resp;
}

// New: non-tabbed API instance for public endpoints (e.g., /public/contact)
const rootBase = import.meta.env.VITE_API_URL || '/api';
export const publicApi = axios.create({
  baseURL: rootBase,
  withCredentials: true
});

// Attach CSRF to mutating requests if token exists (harmless on public routes)
publicApi.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

export default api;

