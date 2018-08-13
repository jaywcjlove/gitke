const Router = require('koa-router');
const namespaces = require('../../controller/git/namespaces');

const router = new Router({
  prefix: '/api'
});

router
  /**
   * @api {get} /user/orgs 自己的组织列表
   * 
   * @apiName getOrgRepos
   * @apiGroup Git
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *  }
   * 
   */
  .get('/user/orgs', namespaces.userOrgsList)


module.exports = router;