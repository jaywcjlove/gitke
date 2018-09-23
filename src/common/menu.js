import React from 'react';
import Icon from '../components/Icon/Menu';

const menuData = [
  {
    name: 'GitKe',
    // icon: 'safety',
    icon: <Icon type="overview" />,
    path: 'dashboard',
    children: [
      {
        name: 'Your Repos',
        icon: <Icon type="overview" />,
        path: 'overview',
      },
      {
        name: 'Repositories',
        icon: <Icon type="repositories" />,
        path: 'repositories',
      },
      {
        name: 'Stars',
        icon: <Icon type="stars" />,
        path: 'stars',
      },
      {
        name: 'Issues',
        icon: <Icon type="issues" />,
        path: 'issues',
      },
      {
        name: 'Pull Requests',
        icon: <Icon type="pullrequests" />,
        path: 'pullrequests',
      },
    ],
  },
  {
    name: 'Organizations',
    icon: <Icon type="organizations" />,
    path: 'organizations',
    children: [
      {
        name: 'Your Organization',
        path: 'overview',
      },
      {
        name: 'Explore Organization',
        path: 'organizations',
      },
    ],
  },
  {
    name: 'Explore',
    icon: <Icon type="explore" />,
    path: 'explore',
    children: [
      {
        name: 'Repositories',
        icon: <Icon type="repositories" />,
        path: 'repositories',
      },
      {
        name: 'Organizations',
        icon: <Icon type="organizations" />,
        path: 'organizations',
      },
    ],
  },
  {
    name: 'Snippets',
    icon: <Icon type="snippets" />,
    path: 'snippets',
    children: [
      {
        name: 'Your Snippets',
        path: 'overview',
      },
      {
        name: 'Explore Snippets',
        path: 'explore',
      },
    ],
  },
  {
    path: '_:owner_:repo',
    children: [
      {
        name: 'Code',
        icon: <Icon type="repositories" />,
        path: '',
      },
      {
        name: 'Issues',
        icon: <Icon type="issues" />,
        path: 'issues',
      },
      {
        name: 'Pull Requests',
        icon: <Icon type="pullrequests" />,
        path: 'pulls',
      },
      {
        name: 'Wiki',
        icon: <Icon type="wiki" />,
        path: 'wiki',
      },
      {
        name: 'Settings',
        icon: <Icon type="reposettings" />,
        path: 'settings',
      },
    ],
  },
  {
    name: 'User Settings',
    icon: <Icon type="settings" />,
    path: 'account',
    children: [
      {
        name: 'Edit Profile',
        path: 'profile',
      },
      {
        name: 'Edit Password',
        path: 'password',
      },
      {
        name: 'Emails',
        path: 'emails',
      },
      {
        name: 'SSH Keys',
        path: 'keys',
      },
    ],
  },
  {
    name: 'Admin Settings',
    icon: <Icon type="adminsettings" />,
    path: 'settings',
    children: [
      {
        name: 'Projects',
        icon: <Icon type="repositories" />,
        path: 'projects',
      },
      {
        name: 'Users',
        icon: <Icon type="users" />,
        path: 'users',
      },
      {
        name: 'Groups',
        icon: <Icon type="organizations" />,
        path: 'groups',
      },
    ],
  },
];


/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/g;
function isUrl(path) {
  return reg.test(path);
}
function formatter(data, parentPath = '/', parentAuthority) {
  return data.map((item) => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
      authority: item.authority || parentAuthority,
    };
    if (item.children) {
      result.children = formatter(item.children, `${parentPath}${item.path}/`, item.authority);
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData).filter(item => item);
