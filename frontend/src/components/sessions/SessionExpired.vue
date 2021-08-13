<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col xs="10" sm="10" md="8" lg="4" xl="3">
        <v-card class="session-expired-card">
          <v-card-title class="gov-header">
            <h4 id="session-expired-text">Session Expired</h4>
          </v-card-title>
          <v-card-text id="session-expired-descriptor">
            <v-row style="margin: .3rem">Your secure session has ended as a result of inactivity.</v-row>
            <a id="login-button" :href="routes.LOGIN" class="ma-1" dark color='#003366'>Log In</a><span>again to continue.</span>
          </v-card-text>
        </v-card>
      </v-col>
      </v-row>
  </v-container>
</template>

<script>
import {BACKEND_ROUTES} from "../../constants/routes";

export default {
  name: 'SessionExpired',

  data() {
    return {
      routes: BACKEND_ROUTES
    };
  }
};
</script>

<style scoped>
  .full-height{
    height: 100%;
  }
  .session-expired-card{
    width: 100%;
    background: #F2E8D5;
  }
</style>
