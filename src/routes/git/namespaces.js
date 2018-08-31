const Router = require('koa-router');
const namespaces = require('../../controller/git/namespaces');

const router = new Router({
  prefix: '/api'
});

router
  .get('/user/orgs', namespaces.userOrgsList)


module.exports = router;