
const path = require('path');
const spawn = require('child_process').spawn;
const through = require('through2');
const debug = require('debug')('git:handler:info');
const { existsRepo } = require('../../utils/fsExtra');


/**
 * git-receive-pack - Receive what is pushed into the repository [push]
 * git-upload-pack - Send objects packed back to git-fetch-pack [fetch]
 */
const services = ['upload-pack', 'receive-pack'];

exports.auth = async (ctx, next) => {
  const { service } = ctx.request.query;
  ctx.response.status = 200;
  try {
    ctx.assert(service, 404, 'service parameter required');
    const serviceType = service.replace(/^git-/, '');
    ctx.state.serviceType = serviceType;
    ctx.assert(services.indexOf(serviceType) > -1, 405, 'service not available');
    // 仓库绝对路径
    ctx.state.repoNamePath = path.join(ctx.state.conf.reposPath, ctx.params.owner, `${ctx.params.repo}`);
    ctx.set('content-type', `application/x-git-${serviceType}-result`);
    const isExistsDir = await existsRepo(ctx.state.repoNamePath);
    ctx.assert(isExistsDir, 404, 'Repository not found.');
    next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = err.message;
  }
}

exports.authorization = async (ctx, next) => {
  if (!ctx.headers["authorization"]) {
    ctx.set('WWW-Authenticate', 'Basic realm="."');
    ctx.set('Content-Type', `application/x-git-${ctx.state.serviceType}-result`);
    ctx.status = 401;
    ctx.body = 'Unauthorized';
    return;
  }
  next();
}

exports.noCache = async (ctx, next) => {
  const { serviceType } = ctx.state;
  if (serviceType) {
    ctx.set('Content-Type', `application/x-git-${serviceType}-advertisement`);
    ctx.set('expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    ctx.set('pragma', 'no-cache');
    ctx.set('cache-control', 'no-cache, max-age=0, must-revalidate');
    next();
  } else {
    ctx.response.status = 402;
    ctx.response.body = 'service parameter required';
  }
}

function pack(s) {
  var n = (4 + s.length).toString(16);
  return Array(4 - n.length + 1).join('0') + n + s;
}

exports.serviceRespond = async (ctx) => {
  const { serviceType, repoNamePath } = ctx.state;
  const dup = through();
  dup.write(pack('# service=git-' + serviceType + '\n'));
  dup.write('0000');

  const cmd = ['git-' + serviceType, '--stateless-rpc', '--advertise-refs', repoNamePath];
  debug('run %s', cmd);
  const ps = spawn(cmd[0], cmd.slice(1));
  ps.on('error', (err) => {
    err.cmd = cmd.join(' ');
    ctx.throw(err);
  });
  ps.stdout.pipe(dup);

  ctx.set('content-type', 'application/x-git-' + serviceType + '-advertisement');
  ctx.body = dup;
}