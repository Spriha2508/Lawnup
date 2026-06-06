import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { getAuth } from 'firebase/auth';

const axiosInstance: AxiosInstance = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Firebase ID token on every request
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const user = getAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { message?: string })?.message ?? error.message ?? 'Network error';
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
