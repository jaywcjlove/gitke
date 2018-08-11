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
   * @api {GET} /api/user/verify 验证用户是否登录
   * 
   * @apiName getUserVerify
   * @apiGroup Users
   *
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
  .delete('/user/logout', user.logout)
  .post('/user/login', user.login)
  .post('/user', user.created);

module.exports = router;