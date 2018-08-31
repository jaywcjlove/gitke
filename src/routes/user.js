const Router = require('koa-router');
const user = require('../controller/users');

const router = new Router({
  prefix: '/api'
});

router
  .get('/users', user.list)
  .get('/user/verify', user.verify)
  .delete('/user/logout', user.logout)
  .post('/user', user.created)
  .post('/user/login', user.login)

module.exports = router;