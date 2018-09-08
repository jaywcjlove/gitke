import React from 'react';
import { model } from '@rematch/core';
import dynamic from 'react-dynamic-loadable';

// wrapper of dynamic
const dynamicWrapper = (models, component) => dynamic({
  models: () => models.map((m) => {
    return import(`../models/${m}.js`).then((md) => {
      const modelData = md[m] || md.default;
      model({ name: m, ...modelData });
    });
  }),
  component,
  LoadingComponent: () => <span>loading....</span>,
});

export const getRouterData = () => {
  const conf = {
    '/login': {
      component: dynamicWrapper(['account'], () => import('../layouts/UserLayout')),
    },
    '/login': { // eslint-disable-line
      component: dynamicWrapper(['account'], () => import('../routes/login')),
    },
    '/join': {
      component: dynamicWrapper(['account'], () => import('../layouts/UserLayout')),
    },
    '/join': { // eslint-disable-line
      component: dynamicWrapper(['account'], () => import('../routes/join')),
    },
    '/join/signup': {
      component: dynamicWrapper(['account'], () => import('../routes/join')),
    },
    '/': {
      component: dynamicWrapper(['account'], () => import('../layouts/BasicLayout')),
    },
    '/exception/403': {
      component: dynamicWrapper([], () => import('../routes/exception/403')),
    },
    '/exception/404': {
      component: dynamicWrapper([], () => import('../routes/exception/404')),
    },
    '/exception/500': {
      component: dynamicWrapper([], () => import('../routes/exception/500')),
    },
    '/dashboard/overview': {
      component: dynamicWrapper(['account', 'repo'], () => import('../routes/dashboard/overview')),
    },
    '/dashboard/repositories': {
      component: dynamicWrapper([], () => import('../routes/dashboard/repositories')),
    },
    '/dashboard/stars': {
      component: dynamicWrapper([], () => import('../routes/dashboard/stars')),
    },
    '/dashboard/issues': {
      component: dynamicWrapper([], () => import('../routes/dashboard/issues')),
    },
    '/dashboard/pullrequests': {
      component: dynamicWrapper([], () => import('../routes/dashboard/pullrequests')),
    },
    '/new': {
      component: dynamicWrapper(['account', 'organizations', 'repo'], () => import('../routes/new')),
    },
    '/organizations/new': {
      component: dynamicWrapper([], () => import('../routes/organizations/new')),
    },
    '/organizations/overview': {
      component: dynamicWrapper([], () => import('../routes/organizations/overview')),
    },
    '/explore/repositories': {
      component: dynamicWrapper([], () => import('../routes/explore/repositories')),
    },
    '/explore/organizations': {
      component: dynamicWrapper([], () => import('../routes/explore/organizations')),
    },
    // 代码片段
    '/snippets/overview': {
      component: dynamicWrapper([], () => import('../routes/snippets')),
    },
    '/snippets/explore': {
      component: dynamicWrapper([], () => import('../routes/snippets/explore')),
    },
    '/snippets/:owner/:id': {
      component: dynamicWrapper([], () => import('../routes/snippets/details')),
    },
    '/account/profile': {
      component: dynamicWrapper([], () => import('../routes/account/profile')),
    },
    '/account/password': {
      component: dynamicWrapper([], () => import('../routes/account/password')),
    },
    '/account/emails': {
      component: dynamicWrapper([], () => import('../routes/account/emails')),
    },
    '/account/keys': {
      component: dynamicWrapper([], () => import('../routes/account/keys')),
    },
    '/help': {
      component: dynamicWrapper([], () => import('../routes/help')),
    },
    '/:owner': {
      component: dynamicWrapper(['account'], () => import('../routes/owner')),
    },
    '/:owner/profile/groups': {
      component: dynamicWrapper(['account'], () => import('../routes/owner/groups')),
    },
    '/:owner/profile/stars': {
      component: dynamicWrapper(['account'], () => import('../routes/owner/stars')),
    },
    '/:owner/:repo': {
      component: dynamicWrapper(['account', 'repo'], () => import('../routes/repo/index')),
    },
    '/:owner/:repo/issues': {
      component: dynamicWrapper(['account'], () => import('../routes/repo/issues')),
    },
    '/:owner/:repo/pulls': {
      component: dynamicWrapper(['account'], () => import('../routes/repo/pulls')),
    },
    '/:owner/:repo/wiki': {
      component: dynamicWrapper(['account'], () => import('../routes/repo/wiki')),
    },
    '/:owner/:repo/settings': {
      component: dynamicWrapper(['account'], () => import('../routes/repo/settings')),
    },
    '/:owner/:repo/tree/:branch': {
      component: dynamicWrapper(['account'], () => import('../routes/repo/tree/branch')),
    },
    '/:owner/:repo/tree/:branch/**': {
      component: dynamicWrapper(['account', 'repo'], () => import('../routes/repo/index')),
    },
    '/:owner/:repo/blob/:branch/**': {
      component: dynamicWrapper(['account', 'repo'], () => import('../routes/repo/index')),
    },
  };
  return conf;
};
