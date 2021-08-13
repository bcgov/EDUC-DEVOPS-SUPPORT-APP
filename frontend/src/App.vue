<template>
  <v-app>
    <SnackBar></SnackBar>
    <NavBar></NavBar>
    <v-main>
      <ModalIdle></ModalIdle>
      <router-view/>
    </v-main>
  </v-app>
</template>
<script>

import NavBar from './components/util/NavBar';
import SnackBar from './components/util/SnackBar';
import ModalIdle from "./components/sessions/ModalIdle";
export default {
  name: 'App',
  components: {
    SnackBar,
    NavBar,
    ModalIdle
  }
};
</script>
