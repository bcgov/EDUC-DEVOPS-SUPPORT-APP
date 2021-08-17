const baseRoute = '/api';
const authRoute = baseRoute + '/auth';

export const BACKEND_ROUTES = Object.freeze(
    {
      LOGIN: authRoute + '/login',
      LOGOUT: authRoute + '/logout',
      REFRESH: authRoute + '/refresh',
      SAGAS: {
        BASE: baseRoute + '/sagas',
        PAGINATED: baseRoute + '/sagas/paginated'
      },
      SESSION_EXPIRED: authRoute + '/logout?sessionExpired=true',
      SESSION_REMAINING_TIME: authRoute + '/user-session-remaining-time',
      TOKEN: authRoute + '/token',
      USER: authRoute + '/user'
    }
);

export const FRONTEND_ROUTES = Object.freeze(
    {
      LOGIN: '/login',
      LOGOUT: '/logout',
      SAGA_DASHBOARD: '/saga-dashboard',
      SAGA_DETAILS: '/saga-details/:sagaId/:sagaType',
      SAGA_DETAILS_SEARCH: '/saga-details',
      SESSION_EXPIRED: '/session-expired',
      EXPIRE_SESSION: '/expire-session',
      UNAUTHORIZED: '/unauthorized-page'
    }
);
