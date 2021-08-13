export default {
  namespaced: true,
  state: {
    loginState: false,
    userInfo: false,
    isAuthorizedUser: false
  },
  mutations: {
    setUserInfo: (state, userInf) => {
      if (userInf) {
        state.userInfo = userInf;
      } else {
        state.userInfo = null;
      }
    },
    setIsAuthorizedUser: (state, isAuthorizedUser) => {
      state.isAuthorizedUser = isAuthorizedUser;
    },
    setLoginState: (state, loginState) => {
      state.loginState = loginState;
    },
  },
  actions: {
    loginState (context, value) {
      context.commit('setLoginState', value);
    },
    userInfo (context, value) {
      context.commit('setUserInfo', value);
    },
    isAuthorizedUser (context, value) {
      context.commit('setIsAuthorizedUser', value);
    }
  }
};
