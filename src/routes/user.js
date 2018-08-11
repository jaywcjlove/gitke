const Router = require('koa-router');

const router = new Router({
  prefix: '/api'
});


router.get('/users', (ctx, next) => {
  ctx.body = 'Hello World! users';
  try {
    
  } catch (error) {
    // 需要注意的是，如果错误被try...catch捕获，就不会触发error事件。
    // 这时，必须调用ctx.app.emit()，手动释放error事件，才能让监听函数生效。
    ctx.app.emit('error', err, ctx);
  }
})

module.exports = router;