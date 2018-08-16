
const crypto = require('crypto');
const path = require('path');
const spawn = require('child_process').spawn;
const through = require('through2');
const Models = require('../../../conf/sequelize');
const conf = require('../../../conf/conf');

function pack(s) {
  var n = (4 + s.length).toString(16);
  return Array(4 - n.length + 1).join('0') + n + s;
}

/**
 * git-receive-pack - Receive what is pushed into the repository [push]
 * git-upload-pack - Send objects packed back to git-fetch-pack [fetch]
 */
const services = ['upload-pack', 'receive-pack'];

module.exports = async (ctx) => {
  const { service } = ctx.request.query;
  try {
    if (!service) {
      ctx.throw(404, 'service parameter required');
    }
    const serviceType = service.replace(/^git-/, '');
    if (services.indexOf(serviceType) < 0) {
      ctx.set('Content-Type', 'text/plain');
      ctx.throw(405, 'service not available');
    }
    ctx.set('content-type', `application/x-git-${serviceType}-result`);

    if (!ctx.headers["authorization"]) {
      ctx.set('Content-Type', 'text/plain');
      ctx.set('WWW-Authenticate', 'Basic realm="."');
      ctx.response.status = 401;
      ctx.response.body = 'Unauthorized';
      return;
    }

    const tokens = ctx.headers["authorization"].split(" ");
    let username;
    let password;
    if (tokens[0] === "Basic") {
      const splitHash = new Buffer.from(tokens[1], 'base64').toString('utf8').split(":");
      username = splitHash.shift();
      password = splitHash.join(":");
    }

    const cryptoPassword = crypto.createHmac('sha256', password).digest('hex');
    const account = await Models.users.findOne({
      attributes: { exclude: ['password'] },
      where: { username, password: cryptoPassword }
    });
    if (!account) {
      ctx.set('Content-Type', 'text/plain');
      ctx.throw(401, 'Account verification failed!');
    }
    const repoNamePath = path.join(conf.reposPath, ctx.params.owner, `${ctx.params.repo}`);

    const dup = through();
    dup.write(pack('# service=git-' + serviceType + '\n'));
    dup.write('0000');

    const cmd = ['git-' + serviceType, '--stateless-rpc', '--advertise-refs', repoNamePath];
    const ps = spawn(cmd[0], cmd.slice(1));
    ps.stdout.pipe(dup);
    ps.on('error', (err) => {
      err.cmd = cmd.join(' ');
      ctx.throw(err);
    });
    ps.stdout.pipe(dup);
    ctx.set('content-type', 'application/x-git-' + serviceType + '-advertisement');
    ctx.body = dup;
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = err.message;
  }
}
