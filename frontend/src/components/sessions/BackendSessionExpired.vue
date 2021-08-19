<template>
  <div style="display: none">
    <a id="logout_href" :href='link'/>
  </div>
</template>

<script>

import {BACKEND_ROUTES} from "../../constants/routes";

export default {
  name: 'BackendSessionExpired',
  data() {
    return {
      link: BACKEND_ROUTES.SESSION_EXPIRED
    };
  },
  mounted() {
    window.location = document.getElementById('logout_href').href;
  },
  methods: {
    logout() {
      this.$store.commit('auth/setJwtToken');
    }
  }
};
</script>
