const Router = require('koa-router');
const repos = require('../../controller/git/repos');

const router = new Router({
  prefix: '/api'
});

router
  .get('/users/:username/repos', repos.list)
  .post('/user/repos', repos.created)
  .get('/repos/:id/tree', repos.reposTree)
  .get('/repos/:owner/:repo', repos.detail)
  .get('/repos/:owner/:repo/readme', repos.readme)
  .get('/orgs/:org/repos', repos.orgReposList)
  .post('/orgs/:org/repos', repos.created)

module.exports = router;