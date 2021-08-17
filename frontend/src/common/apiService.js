import axios from 'axios';
import store from "../store";
import router from "../router";
import {BACKEND_ROUTES, FRONTEND_ROUTES} from "../constants/routes";
import auth from "../store/modules/auth";
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
            if(auth.state.loginState) {
              store.dispatch('auth/loginState', false);
              router.push(FRONTEND_ROUTES.EXPIRE_SESSION);
            } else {
              store.dispatch('auth/loginState', false);
              router.push(BACKEND_ROUTES.LOGIN);
            }
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
