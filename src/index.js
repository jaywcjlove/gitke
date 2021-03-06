const crypto = require('crypto');
const path = require('path');
const Koa = require('koa');
const logger = require('koa-logger')
const cors = require('@koa/cors');
const json = require('koa-json');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const session = require('koa-generic-session');
const SequelizeStore = require('koa-generic-session-sequelize');
const view = require('koa-views');
const static = require('koa-static');
const prepareUrls = require('local-ip-url/prepareUrls');
require('colors-cli/toxic')

const app = new Koa();

const conf = require('../conf/conf');
const Models = require('../conf/sequelize');

app.keys = ['gitke:session'];
app.use(session({
  secret: 'gitke:cat',
  saveUninitialized: false,
  store: new SequelizeStore(Models.sequelize, {}),
  cookie: {
    httpOnly: false, // key
    // maxAge: null,
    // path: '/',
    // secure: false,
    maxAge: 1800000
  },
  rolling: true, // 刷新页面 session 过期时间重置
  resave: true, // 是否允许session重新设置，要保证session有操作的时候必须设置这个属性为true
  proxy: true // if you do SSL outside of node.
}));

const publicPath = path.join(process.cwd(), 'public');

app.use(cors());
app.use(koaBody());
app.use(bodyParser());
app.use(json());
app.use(view(publicPath, {
  extension: 'html'
}));
app.use(static(publicPath));

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

require('./routes')(app);

// 404 页面跳转到首页
app.use(async (ctx, next) => {
  if (/^\/api/.test(ctx.path)) {
    ctx.response.status = 404;
    ctx.body = { message: `Api '${ctx.path}' does not exist!` };
  } else {
    ctx.render('index');
  }
  await next();
});

module.exports = () => {
  const localIpUrl = prepareUrls({
    protocol: 'http',
    host: conf.server.host,
    port: conf.server.port
  });
  Models.sequelize.sync().then(async () => {
    const password = crypto.createHmac('sha256', 'admin').digest('hex');
    // 初始化管理员账号
    const users = await Models.users.findOrCreate({
      where: { id: 1 },
      defaults: {
        username: 'admin',
        name: 'admin',
        admin: true,
        password,
        email: 'admin@admin.com',
      }
    });
    if (users && users.length > 0 && users[0].id) {
      await Models.namespaces.findOrCreate({
        where: { id: 1 },
        defaults: {
          name: users[0].username,
          path: users[0].username,
          owner_id: users[0].id,
        }
      });
    }
  }).then(async () => {
    app.listen(conf.server.port);
    console.log(`  > Config: ${conf.confPath.cyan}`);
    console.log(`  > Server Listening at Local: ${localIpUrl.localUrl.cyan}`);
    console.log(`  >           On Your Network: ${localIpUrl.lanUrl.cyan}`);
    console.log();
  });
}
