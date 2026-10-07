import axios from 'axios';
import { getItem, removeItem, KEY_ACCESS_TOKEN } from './LocalStorageManager';
export const axiosClient = axios.create({ baseURL: import.meta.env.VITE_SERVER_BASE_URL, timeout: 30000 });
axiosClient.interceptors.request.use(request => {
  const token = getItem(KEY_ACCESS_TOKEN);
  if (token) request.headers.Authorization = 'Bearer ' + token;
  return request;
});
axiosClient.interceptors.response.use(response => {
  if (response.data?.status === 'error') {
    const error = new Error(response.data.message || 'Request failed');
    error.response = response;
    return Promise.reject(error);
  }
  return response;
}, error => {
  if (error.response?.status === 401 && getItem(KEY_ACCESS_TOKEN)) { removeItem(KEY_ACCESS_TOKEN); window.location.assign('/login'); }
  error.message = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
  return Promise.reject(error);
});
