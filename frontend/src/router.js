import {PAGE_TITLES} from "./constants/pages";
import SagaDashboard from "./components/sagas/SagaDashboard";
import VueRouter from 'vue-router';
import Vue from 'vue';
import Login from "./components/sessions/Login";
import { FRONTEND_ROUTES} from "./constants/routes";
import SagaDetails from "./components/sagas/SagaDetails";
import authStore from './store/modules/auth';
import SessionExpired from "./components/sessions/SessionExpired";
import BackendSessionExpired from "./components/sessions/BackendSessionExpired";
import ErrorPage from "./components/util/ErrorPage";
import UnAuthorizedPage from "./components/sessions/UnAuthorizedPage";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: FRONTEND_ROUTES.SAGA_DASHBOARD,
      name: 'sagaDashboard',
      component: SagaDashboard,
      meta: {
        pageTitle: PAGE_TITLES.SAGA_DASHBOARD,
        requiresAuth: true
      }
    },
    {
      path: FRONTEND_ROUTES.SAGA_DETAILS,
      name: 'sagaDetails',
      component: SagaDetails,
      props: (route) => ({
        sagaId: route.params.sagaId,
        sagaType: route.params.sagaType
      }),
      meta: {
        pageTitle: PAGE_TITLES.SAGA_DETAILS,
        requiresAuth: true
      }
    },
    {
      path: FRONTEND_ROUTES.LOGIN,
      name: 'login',
      component: Login,
      meta: {
        pageTitle: PAGE_TITLES.LOGIN,
        requiresAuth: false
      }
    },
    {
      path: FRONTEND_ROUTES.SESSION_EXPIRED,
      name: 'sessionExpired',
      component: SessionExpired,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: FRONTEND_ROUTES.EXPIRE_SESSION,
      name: 'expireSession',
      component: BackendSessionExpired,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/unauthorized-page',
      name: 'unauthorized-page',
      component: UnAuthorizedPage,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/error',
      name: 'error',
      component: ErrorPage,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '*',
      name: 'notfound',
      redirect: FRONTEND_ROUTES.SAGA_DASHBOARD,
      meta: {
        requiresAuth: true
      },
    }
  ],
});

router.beforeEach((to, from, next) => {
  if(to.meta.requiresAuth) {
    if (authStore.state.loginState) {
      if(!authStore.state.isAuthorizedUser) {
        next(FRONTEND_ROUTES.UNAUTHORIZED);
      }
      else if (to.path === FRONTEND_ROUTES.LOGIN) {
        next(FRONTEND_ROUTES.SAGA_DASHBOARD);
      }
      else {
        next();
      }
    } else {
      next(FRONTEND_ROUTES.LOGIN);
    }
  } else {
    next();
  }
});
export default router;
