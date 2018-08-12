const Router = require('koa-router');
const repos = require('../../controller/git/repos');

const router = new Router({
  prefix: '/api'
});

router
  /**
   * @api {POST} /user/repos 创建一个Git仓库
   * 
   * @apiName CreateRepos
   * @apiGroup Git
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "namespace_id": 11,
   *    "name": "test2",
   *    "description": ""
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "updated_at": "2018/08/13 00:43:35",
   *    "created_at": "2018/08/13 00:43:35",
   *    "import_url": null,
   *    "forks_url": null,
   *    "fork": false,
   *    "private": false,
   *    "id": 16,
   *    "namespace_id": 1,
   *    "name": "test2",
   *    "description": "",
   *    "path": "test2",
   *    "creator_id": 1
   *  }
   * 
   */
  .post('/user/repos', repos.created)
  .post('/orgs/:org/repos', repos.created)

module.exports = router;