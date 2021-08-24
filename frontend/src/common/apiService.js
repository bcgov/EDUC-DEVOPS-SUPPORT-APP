import axios from 'axios';
import store from "../store";
import AuthService from '@/common/authService';

// Create new non-global axios instance and intercept strategy
const apiAxios = axios.create();

const intercept = axios.interceptors.response.use(
  res => res,
  error => {
    if (error.response.status === 401) {
      const originalRequest = error.config;
      axios.interceptors.response.eject(intercept);
      return new Promise((resolve, reject) => {
        AuthService.refreshAuthToken()
          .then(() => {
            resolve(axios(originalRequest));
          })
          .catch(e => {
            store.dispatch('auth/loginState', false);
            reject(e);
          })
          });
    }
    return Promise.reject(error);
  });

export default {
  apiAxios: apiAxios,
  intercept: intercept
};
