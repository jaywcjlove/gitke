const through = require('through2');
const crypto = require('crypto');
const path = require('path');
const git = require('nodegit');
const debug = require('debug')('git:handler:action');
const spawn = require('child_process').spawn;
const encode = require('git-side-band-message');
const Models = require('../../../conf/sequelize');

const services = ['upload-pack', 'receive-pack'];

const write = function (s) {
  return function (message, skipLineEnding) {
    message = skipLineEnding ? message : message + '\n';
    s.push(encode(message));
  };
};

exports.authUserAccount = async (ctx, next) => {
  // 用户名密码获取
  const tokens = ctx.headers["authorization"] ? ctx.headers["authorization"].split(" ") : [];
  if (tokens[0] === "Basic") {
    const splitHash = new Buffer.from(tokens[1], 'base64').toString('utf8').split(":");
    username = splitHash.shift();
    password = splitHash.join(":");
    debug('account: %s', username, password)
    const cryptoPassword = crypto.createHmac('sha256', password).digest('hex');
    let account = await Models.users.findOne({
      attributes: { exclude: ['password'] },
      where: { username, password: cryptoPassword }
    });
    
    if (!account) {
      ctx.set('Content-Type', 'text/plain');
      // ctx.body = 'Account verification failed!111';
      ctx.throw(401, 'Account verification failed!');
    }
  }
  await next()
}
exports.action = async (ctx) => {
  const { service } = ctx.params;
  const repoNamePath = path.join(ctx.state.conf.reposPath, ctx.params.owner, `${ctx.params.repo}`);
  const repo = await git.Repository.open(repoNamePath);

  ctx.assert(services.indexOf(service) > -1, 405, 'service not avaiable');
  ctx.set('content-type', `application/x-git-${service}-result`);
  // const compressed = ctx.acceptsEncodings('gzip', 'identity') === 'gzip';

  const run = function () {
    const cmd = ['git-' + service, '--stateless-rpc', repo.path()];
    debug('run %s', cmd.join(' '));
    const ps = spawn(cmd[0], cmd.slice(1));
    ps.on('error', function (e) {
      debug('run %s', e);
      e.cmd = cmd.join(' ');
      ctx.throw(e);
    });
    return ps;
  };

  const ps = run();
  const reply = through(function (c, enc, callback) {
    const writeThis = write(this);
    // delay the signal for ending
    if (c.length === 4 && c.toString() === '0000') {
      writeThis('Powered by Gitke');
      callback();
    } else {
      callback(null, c);
    }
  }, function (cb) {
    const self = this;
    (function () {
      debug('run pass end');
      self.push(new Buffer('0000'));
      self.push(null);
      cb.apply(null, arguments);
    })();
  });

  const buffered = through().pause();
  const tmp = through();
  ctx.req.pipe(tmp).pipe(buffered);

  ps.stdout.pipe(reply);
  const throwUp = ctx.throw.bind(ctx);
  reply.on('error', throwUp);
  ps.on('error', throwUp);
  buffered.pipe(ps.stdin);
  buffered.resume();
  ctx.body = reply;
};
