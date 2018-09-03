const Router = require('koa-router');
const rawHandler = require('../../controller/git/raw');

const router = new Router();
// http://localhost:19870/admin/gitke/raw/master/README.md
router
  .get('/:owner/:repo/raw/:ref/*', rawHandler)

module.exports = router;