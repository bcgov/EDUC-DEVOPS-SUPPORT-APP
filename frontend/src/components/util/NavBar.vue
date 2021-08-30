<template>
<div class="mb-1">
  
  <v-navigation-drawer
    v-if="isAuthorizedUser"
    expand-on-hover
    permanent
    clipped
    app
    color="secondaryBackground"
  >
    <v-list-item class="px-2">
      <v-list-item-avatar>
        <v-avatar class="pr-2">
          <v-icon>
          mdi-account-circle
          </v-icon>
        </v-avatar>
      </v-list-item-avatar>
      
      <v-list-item-title>{{ userInfo.displayName }}</v-list-item-title>
    </v-list-item>
    
    <v-divider></v-divider>
    
    <v-list nav>
      <router-link v-for="item in items" :key="item.title" :to="item.ref" class="router-link">
      <v-list-item
        class="v-list-item--link"
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      </router-link>
      <v-list-item :href="logoutRoute">
        <v-list-item-icon>
          <v-icon>mdi-logout</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    
    <v-divider></v-divider>
    
    <v-list-item class="pl-3 ">
      <v-list-item-icon class="mr-3">
        <v-switch
          class="mt-0"
          v-model="$vuetify.theme.dark"
          dense
          light
          color="accent"
        ></v-switch>
      </v-list-item-icon>
      <v-list-item-content class="pt-0">
        Dark Mode
      </v-list-item-content>
    </v-list-item>
  </v-navigation-drawer>
  <v-app-bar app clipped-left elevation="0" color="primary" :dark="true" id="navBar" class=" pr-8">
    <v-col xl="1" md="2" cols="6">
      <v-img
        src="@/assets/images/bc-gov-logo.svg"
        class="ma-4"
        contain
        alt="B.C. Government Logo"
      ></v-img>
    </v-col>
      <v-toolbar-title><h3>DOSA</h3></v-toolbar-title>
    <v-spacer></v-spacer>
  </v-app-bar>
</div>
</template>

<script>
  import {BACKEND_ROUTES, FRONTEND_ROUTES} from '../../constants/routes';
import {mapState} from 'vuex';

export default {
  name: 'navBar',
  props: {
    title: {
      type: String,
      default: "true"
    }
  },
  data () {
    return {
      items: [
        {
          icon: 'mdi-poll',
          title: 'Saga Dashboard',
          ref: FRONTEND_ROUTES.SAGA_DASHBOARD
        }
      ]
    }
  },
  computed: {
    ...mapState('auth', ['isAuthorizedUser', 'userInfo']),
    logoutRoute() {
      return BACKEND_ROUTES.LOGOUT;
    }
  }
}
</script>
<style scoped>
  #navBar {
    border-bottom: 2px solid rgb(252, 186, 25) !important;
  }
  .router-link {
    text-decoration: none;
  }
</style>
