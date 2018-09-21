const Router = require('koa-router');
const repos = require('../../controller/git/repos');
const tags = require('../../controller/git/repos/tags');

const router = new Router({
  prefix: '/api'
});

router
  .get('/users/:username/repos', repos.list)
  .post('/user/repos', repos.created)
  .get('/repos/:id/tree', repos.reposTree)
  .get('/repos/:owner/:repo', repos.detail)
  .delete('/repos/:owner/:repo', repos.delete)
  .get('/repos/:owner/:repo/tags', tags.list)
  .get('/repos/:owner/:repo/tags/:tag_name', tags.detail)
  .get('/repos/:owner/:repo/readme', repos.readme)
  .get('/repos/:owner/:repo/blob/:ref/*', repos.fileDetail)
  .get('/orgs/:org/repos', repos.orgReposList)
  .post('/orgs/:org/repos', repos.created);

module.exports = router;
