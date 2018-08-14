const Router = require('koa-router');
const gitClient = require('../../controller/git-client/clone');

const router = new Router();

router
  //  Git clone
  .get('/:owner/:repo/info/refs', gitClient.clone);

module.exports = router;