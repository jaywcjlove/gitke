import React from 'react';
import { model } from '@rematch/core';
import dynamic from 'react-dynamic-loadable';

// wrapper of dynamic
const dynamicWrapper = (models, component) => dynamic({
  models: () => models.map((m) => {
    return import(`../models/${m}.js`).then((md) => {
      model({ name: m, ...md[m] });
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
    '/dashboard/snippets': {
      component: dynamicWrapper([], () => import('../routes/dashboard/snippets')),
    },
    '/dashboard/overview': {
      component: dynamicWrapper([], () => import('../routes/dashboard/overview')),
    },
    '/dashboard/repositories': {
      component: dynamicWrapper([], () => import('../routes/dashboard/repositories')),
    },
    '/dashboard/groups': {
      component: dynamicWrapper([], () => import('../routes/dashboard/groups')),
    },
    '/dashboard/issues': {
      component: dynamicWrapper([], () => import('../routes/dashboard/issues')),
    },
    '/dashboard/pullrequests': {
      component: dynamicWrapper([], () => import('../routes/dashboard/pullrequests')),
    },
    '/new': {
      component: dynamicWrapper([], () => import('../routes/new')),
    },
    '/groups/new': {
      component: dynamicWrapper([], () => import('../routes/groups/new')),
    },
    '/explore/groups': {
      component: dynamicWrapper([], () => import('../routes/explore/groups')),
    },
    // 代码片段
    '/snippets': {
      component: dynamicWrapper([], () => import('../routes/snippets')),
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
      component: dynamicWrapper(['account'], () => import('../routes/login')),
    },
    '/:owner/:repo': {
      component: dynamicWrapper(['account'], () => import('../routes/login')),
    },
  };
  return conf;
};
