module.exports = {
  devServer: {

    proxy: {
      ...['/api'].reduce(
          (acc, ctx) => ({
            ...acc,
            [ctx]: {
              target: process.env.VUE_APP_API_ROOT,
              changeOrigin: true,
              ws: false
            }
          }),
          {}
      ),
    }
  },
  transpileDependencies: [
    'vuetify'
  ]
};
