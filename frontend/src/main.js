import Vue from 'vue';
import vuetify from './plugins/vuetify';
import App from './App';
import router from './router';
import store from './store';
import ApiService from "./common/apiService";
import {BACKEND_ROUTES} from "./constants/routes";
import {ROLES} from "./constants/roles";
import VueAxios from "vue-axios";
import axios from "axios";

Vue.config.productionTip = false;
Vue.use(VueAxios, ApiService.apiAxios);
axios
  .get(BACKEND_ROUTES.USER)
  .then(response => {
    store.dispatch('auth/userInfo', response.data);
    store.dispatch('auth/loginState', true);
    store.dispatch('auth/isAuthorizedUser', response?.data?.userRoles.includes(ROLES.DOSA_ADMIN));
  })
  .catch((e) => {
    store.dispatch('auth/loginState', false);
    store.dispatch('auth/userInfo', false);
    store.dispatch('auth/isAuthorizedUser', false);
    throw e;
  })
  .finally( () => {
    new Vue({
      vuetify,
      router,
      store,
      render: h => h(App)
    }).$mount('#app');
  });
