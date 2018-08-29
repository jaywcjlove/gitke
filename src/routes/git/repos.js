const Router = require('koa-router');
const repos = require('../../controller/git/repos');

const router = new Router({
  prefix: '/api'
});

router
  /**
   * @api {get} /users/:username/repos 用户，项目列表
   * 
   * @apiName getRepos
   * @apiGroup Git
   *
   * @apiParam {String} username 用户名
   * 
   * @apiParamExample {json} Request-Example:
   *  {
   *    "page": 2,
   *    "limit": 10,
   *  }
   * 
   * @apiSuccess {Number} count 总条数.
   * @apiSuccess {Number} [limit=10] 每页显示多少条.
   * @apiSuccess {Number} [page=1] 弟几页.
   * @apiSuccess {Number} [pages] 总页数.
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "page": 1,
   *    "pages": 1,
   *    "limit": 10,
   *    "count": 1,
   *    "rows": [
   *      {
   *        "updated_at": "2018/08/28 01:24:13",
   *        "created_at": "2018/08/28 01:24:13",
   *        "id": 12,
   *        "name": "testw",
   *        "path": "testw",
   *        "description": "Native Node bindings to Git. https://www.nodegit.org/",
   *        "namespace_id": 1,
   *        "creator_id": 1,
   *        "import_url": null,
   *        "forks_url": null,
   *        "fork": false,
   *        "private": false,
   *        "owner": {
   *          "updated_at": "2018/08/22 11:50:12",
   *          "created_at": "2018/08/22 11:50:12",
   *          "id": 1,
   *          "username": "admin",
   *          "name": "admin",
   *          "admin": true,
   *          "bio": "",
   *          "location": "",
   *          "organization": "",
   *          "preferred_language": "",
   *          "email": "admin@admin.com",
   *          "public_email": null,
   *          "avatar": "",
   *          "linkedin": "",
   *          "web_url": null,
   *          "skype": "",
   *          "state": "active"
   *        },
   *        "namespace": {
   *          "updated_at": "2018/08/22 11:50:12",
   *          "created_at": "2018/08/22 11:50:12",
   *          "id": 1,
   *          "name": "admin",
   *          "path": "admin",
   *          "owner_id": "1",
   *          "type": null,
   *          "description": "",
   *          "avatar": ""
   *        }
   *      }
   *    ]
   *  }
   * 
   */
  .get('/users/:username/repos', repos.list)
  /**
   * @api {POST} /user/repos 用户创建项目
   * 
   * @apiName CreateRepos
   * @apiGroup Git
   *
   * @apiParamExample {json} Request-Example:
   *  {
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
  /**
   * @api {get} /repos/:owner/:repo 项目详情
   * 
   * @apiName getRepo
   * @apiGroup Git
   *
   * @apiParam {String} :owner 命名空间名称，如用户名称，或者组织名称
   * @apiParam {String} :repo 仓库名称
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *  }
   * 
   */
  .get('/repos/:owner/:repo', repos.detail)
  /**
   * @api {get} /repos/:owner/:repo/readme Get README.md
   * 
   * @apiDescription 获取仓库中的 README.md 内容
   * 
   * @apiName getOrgReadme
   * @apiGroup Git
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "content": ""
   *  }
   * 
   */
  .get('/repos/:owner/:repo/readme', repos.readme)
  /**
   * @api {get} /orgs/:org/repos 组,项目列表
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
  .get('/orgs/:org/repos', repos.orgReposList)
  /**
   * @api {POST} /orgs/:org/repos 组织创建仓库
   * 
   * @apiName CreateOrgRepos
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
  .post('/orgs/:org/repos', repos.created)

module.exports = router;