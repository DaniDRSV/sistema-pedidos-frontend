import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    response.message = body.message;
    response.data = body.data;
  }
  return response;
});

export const getErrorMessage = (error, fallback = "Ocurrió un error. Intenta de nuevo.") => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request && !error.response) return "No hay conexión con el servidor.";
  return fallback;
};

export const getErrorDetails = (error) => error.response?.data?.error?.details;

export default api;
