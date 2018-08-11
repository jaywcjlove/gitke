const crypto = require('crypto');
const path = require('path');
const Koa = require('koa');
const logger = require('koa-logger')
const cors = require('@koa/cors');
const json = require('koa-json');
const koaBody = require('koa-body');
const session = require('koa-generic-session');
const static = require('koa-static');
const SequelizeStore = require('koa-generic-session-sequelize');
const app = new Koa();

const Models = require('../conf/sequelize');

app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: false,
  store: new SequelizeStore(Models.sequelize),
  rolling: true, // 刷新页面 session 过期时间重置
  resave: true, // 是否允许session重新设置，要保证session有操作的时候必须设置这个属性为true
  proxy: true // if you do SSL outside of node.
}));

app.use(cors());
app.use(koaBody());
app.use(json());

// 404 页面跳转到首页
app.use(async (ctx, next) => {
  await next();
  if (ctx.body || !ctx.idempotent) return;
  ctx.redirect('/index.html');
});

app.use(static(path.join(__dirname, '..', 'public')));

// 忽略打印资源加载
function ignoreAssets(mw) {
  return async function (ctx, next) {
    if (/(\.js|\.css|\.ico)$/.test(ctx.path)) {
      await next();
    } else {
      // must .call() to explicitly set the receiver
      await mw.call(this, ctx, next);
    }
  };
}

app.use(ignoreAssets(logger()));
app.on('error', function (err) {
  if (process.env.NODE_ENV != 'test') {
    console.log('sent error %s to the cloud', err.message);
    console.log(err);
  }
});

require('./routes')(app);

Models.sequelize.sync().then(() => {
  // 初始化管理员账号
  return Models.users.findById(1).then((ind) => {
    if (!ind) {
      password = crypto.createHmac('sha256', 'admin').digest('hex');
      return Models.users.bulkCreate([
        { id: 1, username: 'admin', admin: true, password, email: 'admin@admin.com' },
      ], { logging: false }).then(function () {
        console.log('  > 管理员信息初始化成功');
      });
    }
  })
}).then(async () => {
  app.listen(2018);
  console.log('  > listening on port http://127.0.0.1:2018');
});