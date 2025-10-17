// src/lib/api.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';

// export const apiPublic: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 15000,
// });

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// ===== TIPADO PARA FLAGS PERSONALIZADAS =====
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    /** si true, no agrega Authorization ni intenta refresh */
    skipAuth?: boolean;
    /** bandera interna para evitar refresh recursivo */
    _noRefresh?: boolean;
    /** bandera interna para evitar retry infinito */
    _retry?: boolean;
  }
}

// ===== INTERCEPTORES SOLO EN `api` (protegido) =====
type AttachOpts = {
  getAccessToken: () => Promise<string | null> | string | null;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized?: () => Promise<void> | void;
  /** endpoints donde JAMÁS se debe inyectar auth ni refrescar */
  excludePaths?: RegExp;
};

export function attachAuthInterceptors(instance: AxiosInstance, opts: AttachOpts) {
  const exclude = opts.excludePaths ?? /(\/auth\/login|\/auth\/refresh-token|\/auth\/logout)$/i;

  const reqId = instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Respeta flags y paths públicos
    if (config.skipAuth || exclude.test(config.url ?? '')) return config;

    // getAccessToken debe ser "seguro": si falla, que retorne null
    let token: string | null = null;
    try { token = await opts.getAccessToken(); } catch { token = null; }

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let isRefreshing = false;
  let queue: {
    resolve: (v?: unknown) => void;
    reject: (r?: unknown) => void;
    config: InternalAxiosRequestConfig;
  }[] = [];

  const flush = async (error: unknown, token: string | null) => {
    queue.forEach(({ resolve, reject, config }) => {
      if (error) return reject(error);
      config.headers = config.headers ?? {};
      if (token) (config.headers as any).Authorization = `Bearer ${token}`;
      resolve(instance(config));
    });
    queue = [];
  };

  const resId = instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig | undefined;
      const status = error.response?.status;

      // Si no hay config, o es público, o marcaste skipAuth/noRefresh → no intentes refresh
      if (!original || original.skipAuth || original._noRefresh || (original.url && exclude.test(original.url))) {
        return Promise.reject(error);
      }

      if (status === 401 && !original._retry) {
        original._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => queue.push({ resolve, reject, config: original }));
        }

        isRefreshing = true;
        try {
          const newToken = await opts.refreshAccessToken(); // Debe actualizar tu store
          await flush(null, newToken);
          isRefreshing = false;

          original.headers = original.headers ?? {};
          if (newToken) (original.headers as any).Authorization = `Bearer ${newToken}`;
          return instance(original);
        } catch (e) {
          isRefreshing = false;
          await flush(e, null);
          if (opts.onUnauthorized) await opts.onUnauthorized();
          return Promise.reject(e);
        }
      }

      return Promise.reject(error);
    }
  );

  return () => {
    instance.interceptors.request.eject(reqId);
    instance.interceptors.response.eject(resId);
  };
}
