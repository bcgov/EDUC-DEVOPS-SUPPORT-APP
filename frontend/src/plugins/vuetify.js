import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#003366',
        secondary: '#38598A',
        accent: '#FCBA19',
        background: '#FFFFFF',
        secondaryBackground: '#f9f9f9'
      },
      dark: {
        primary: '#003366',
        secondary: '#38598A',
        accent: '#FCBA19',
      }
    }
  }
});
