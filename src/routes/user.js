const Router = require('koa-router');
const user = require('../controller/users');

const router = new Router({
  prefix: '/api'
});


/**
 * @apiDefine UserInfo
 * @apiSuccess {Number} id 用户ID.
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} email 邮箱
 * @apiSuccess {String} created_at 创建时间
 * @apiSuccess {String} updated_at 更新时间
 */

router
  .get('/users', user.list)
  /**
   * @api {GET} /api/user/verify 验证登录
   * 
   * @apiName getUserVerify
   * @apiGroup Users
   *
   * @apiUse UserInfo
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "updated_at": "2018/08/11 19:05:30",
   *    "created_at": "2018/08/11 19:05:30",
   *    "id": 1,
   *    "username": "admin",
   *    "name": "",
   *    "admin": true,
   *    "bio": "",
   *    "location": "",
   *    "organization": "",
   *    "preferred_language": "",
   *    "email": "admin@admin.com",
   *    "public_email": "",
   *    "avatar_url": "",
   *    "linkedin": "",
   *    "web_url": "",
   *    "skype": "",
   *    "state": "active",
   *    "token": "5c2d6d45-ec94-319c-a9c8-cae43e192b65"
   *  }
   * 
   * @apiErrorExample {json} Error-Response:
   *  HTTP/1.1 401 Not Found
   *  {
   *    "message": "账号未登录，请登录账号！"
   *  }
   */
  .get('/user/verify', user.verify)
  /**
   * @api {delete} /api/user/logout 退出登录
   * 
   * @apiName logout
   * @apiGroup Users
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "message": "您已退出登录"
   *  }
   * 
   */
  .delete('/user/logout', user.logout)
  /**
   * @api {post} /api/user 新增用户
   * 
   * @apiName created
   * @apiGroup Users
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "updated_at": "2018/08/13 00:55:17",
   *    "created_at": "2018/08/13 00:55:17",
   *    "name": "",
   *    "admin": false,
   *    "bio": "",
   *    "location": "",
   *    "organization": "",
   *    "preferred_language": "",
   *    "avatar": "",
   *    "linkedin": "",
   *    "skype": "",
   *    "state": "active",
   *    "id": 2,
   *    "username": "wcji232",
   *    "email": "wowohoo@gmai.com",
   *    "public_email": "ss@qq.com",
   *    "password": "admin",
   *    "web_url": "http://foo.com"
   *  }
   *
   * @apiErrorExample {json} Error-Response:
   *  HTTP/1.1 401 Not Found
   *  {
   *    "message": "账号未登录，请登录账号！"
   *  }
   */
  .post('/user', user.created)
  /**
   * @api {post} /api/login 用户登录
   * 
   * @apiName login
   * @apiGroup Users
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "username": "admin",
   *    "password": "admin"
   *  }
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   *  {
   *    "updated_at": "2018/08/13 00:55:17",
   *    "created_at": "2018/08/13 00:55:17",
   *    "name": "",
   *    "admin": false,
   *    "bio": "",
   *    "location": "",
   *    "organization": "",
   *    "preferred_language": "",
   *    "avatar": "",
   *    "linkedin": "",
   *    "skype": "",
   *    "state": "active",
   *    "id": 2,
   *    "username": "wcji232",
   *    "email": "wowohoo@gmai.com",
   *    "public_email": "ss@qq.com",
   *    "password": "admin",
   *    "web_url": "http://foo.com"
   *  }
   *
   * @apiErrorExample {json} Error-Response:
   *  HTTP/1.1 401 Not Found
   *  {
   *    "message": "用户名或密码错误！"
   *  }
   */
  .post('/user/login', user.login)

module.exports = router;