export default {
  namespaced: true,
  state: {
    alertNotificationText: '',
    alertNotificationQueue: [],
    alertNotification: false
  },
  mutations: {
    setAlertNotificationText: (state, alertNotificationText) => {
      state.alertNotificationText = alertNotificationText;
    },
    setAlertNotification: (state, alertNotification) => {
      state.alertNotification = alertNotification;
    },
    addAlertNotification(state, text) {
      state.alertNotificationQueue.push(text);
      if (!state.alertNotification) {
        state.alertNotification = true;
      }
    }
  },
};
