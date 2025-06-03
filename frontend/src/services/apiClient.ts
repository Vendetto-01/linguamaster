import axios from 'axios';

// The base URL for the backend API.
// This should be configurable, perhaps via an environment variable.
// For local development, it will point to the backend server's port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors here if needed (e.g., for auth tokens)

export default apiClient;