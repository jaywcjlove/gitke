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
   * @api {get} /repos/:id/tree 项目文件列表
   * 
   * @apiDescription 获取仓库中的文件列表
   *
   * @apiParam {String} id 项目ID
   * @apiParam {String} [path] 存储库中的路径
   * @apiParam {String} [ref] 存储库分支或标记的名称，如果没有给出默认分支
   * @apiParam {String} [recursive] 用于获取递归树的布尔值（默认为false）
   * 
   * @apiName getOrgReadme
   * @apiGroup Git
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "sha": "3a290ae75747e573355bea4ae011d676046c6fcc",
   *    "summary": "Add src/READMe.md",
   *    "message": "Add src/READMe.md\n",
   *    "messageRaw": "Add src/READMe.md\n",
   *    "owner": {
   *      "name": "jaywcjlove",
   *      "email": "398188662@qq.com"
   *    },
   *    "amend": {},
   *    "time": 1535567392,
   *    "date": "2018-08-29T18:29:52.000Z",
   *    "timeMs": 1535567392000,
   *    "timeOffset": 480,
   *    "path": "",
   *    "entryCount": 4,
   *    "tree": [
   *      {
   *        "id": "5ee591df6a4a981a1c2ae5b532bb86edc80773c8",
   *        "name": "examle.xml",
   *        "path": "examle.xml",
   *        "filemodeRaw": 33188,
   *        "mode": 33188,
   *        "type": "blob"
   *      },
   *      {
   *        "id": "9daeafb9864cf43055ae93beb0afd6c7d144bfa4",
   *        "name": "README.md",
   *        "path": "src/README.md",
   *        "filemodeRaw": 33188,
   *        "mode": 33188,
   *        "type": "blob"
   *      },
   *    ]
   *  }
   * 
   */
  .get('/repos/:id/tree', repos.reposTree)
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