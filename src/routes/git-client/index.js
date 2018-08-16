const Router = require('koa-router');
const gitClient = require('../../controller/git-client');

const router = new Router();

router
  // Git clone
  .get('/:owner/:repo/info/refs', gitClient.info)
  .post('/:owner/:repo/git-:service', gitClient.action)

module.exports = router;