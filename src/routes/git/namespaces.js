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
   * @apiParam {String} [type='Group'] Group 为组，null为个人组，都被认为是命名空间
   * @apiParam {String} [username] 用户名，不传递默认为自己
   * 
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *  }
   * 
   */
  .get('/user/orgs', namespaces.userOrgsList)


module.exports = router;