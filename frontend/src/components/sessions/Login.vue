<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-card class="login-card" color="secondaryBackground">
        <v-card-title class="gov-header">
          <h4 id="login_text">Log In</h4>
        </v-card-title>
        <v-card-text id="login_descriptor">
          To access the DOSA Application, you must have a valid IDIR.
        </v-card-text>
        <v-card-actions>
          <v-row justify="center" no-gutters>
            <v-btn id="login-button" :href="routes.LOGIN" color='primary'>Log In <v-icon>mdi-login</v-icon></v-btn>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
  import {BACKEND_ROUTES} from '../../constants/routes';
  import {mapMutations} from 'vuex';
  //import router from '../router';

  export default {
    name: 'Login',
    data() {
      return {
        routes: BACKEND_ROUTES
      };
    },
    methods: {
      ...mapMutations('auth', ['setIsAuthenticated']),
      clearStorage() {
        this.$store.commit('auth/setJwtToken');
      }
    }
  };
</script>

