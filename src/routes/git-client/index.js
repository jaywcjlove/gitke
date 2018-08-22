const Router = require('koa-router');
const info = require('../../controller/git-client/info');
const action = require('../../controller/git-client/action');
const router = new Router();

router
  // Git clone
  .get('/:owner/:repo/info/refs', info.auth, info.authorization, info.noCache, info.serviceRespond)
  .post('/:owner/:repo/git-:service', action.authUserAccount, action.action)

module.exports = router;