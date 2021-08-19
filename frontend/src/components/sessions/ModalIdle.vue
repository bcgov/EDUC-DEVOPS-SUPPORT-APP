<template>
  <div style="display: none">
    <a id="logout_href" :href='BACKEND_ROUTES.SESSION_EXPIRED'/>
  </div>
</template>

<script>
import {BACKEND_ROUTES} from '@/constants/routes';
import ApiService from '../../common/apiService';
import {mapState,mapMutations} from 'vuex';
import store from "../../store";

export default {
  data() {
    return {
      BACKEND_ROUTES: BACKEND_ROUTES
    };
  },
  async mounted() {
    await this.checkAndLogoutUserOnSessionExpiry();

  },
  computed: {
    ...mapState('auth', ['isAuthorizedUser']),
  },
  methods: {
    ...mapMutations('auth', ['setUserInfo', 'setLoginState']),
    async checkAndLogoutUserOnSessionExpiry() {
      if (this.isAuthorizedUser) {
        ApiService.apiAxios
          .get(BACKEND_ROUTES.SESSION_REMAINING_TIME)
          .then( response => {
            setTimeout(() => {
              this.checkAndLogoutUserOnSessionExpiry();
            }, response.data);
          }).catch(() => {
          window.location = document.getElementById('logout_href').href;
          store.dispatch('auth/loginState', false);
          store.dispatch('auth/userInfo', false);
          store.dispatch('auth/isAuthorizedUser', false);
        })
      }
    }

  }
};
</script>
