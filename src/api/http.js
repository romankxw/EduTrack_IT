// src/api/http.js
import axios from 'axios';

export class HttpClient {
  constructor(baseURL = 'http://localhost:3001', { timeout = 8000 } = {}) {
    this.baseURL = baseURL;
    this.instance = axios.create({ baseURL, timeout });
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(HttpClient.normalize(error)),
    );
  }

  static normalize(error) {
    if (error.response) {
      return new Error(`Request failed with status ${error.response.status}`);
    }
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out');
    }
    return new Error('Network error. Is the API running?');
  }

  get(url, config) {
    return this.instance.get(url, config);
  }

  post(url, data, config) {
    return this.instance.post(url, data, config);
  }

  patch(url, data, config) {
    return this.instance.patch(url, data, config);
  }

  delete(url, config) {
    return this.instance.delete(url, config);
  }
}

export const http = new HttpClient('http://localhost:3001');
