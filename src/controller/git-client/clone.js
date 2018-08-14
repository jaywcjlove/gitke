
const crypto = require('crypto');
const Models = require('../../../conf/sequelize');

/**
 * git-receive-pack - Receive what is pushed into the repository [push]
 * git-upload-pack - Send objects packed back to git-fetch-pack [fetch]
 */
const services = ['upload-pack', 'receive-pack'];

module.exports = {
  clone: async (ctx) => {
    const { service } = ctx.request.query;

    try {
      if (!service) {
        ctx.throw(404, 'service parameter required');
      }
      const serviceType = service.replace(/^git-/, '');
      if (services.indexOf(serviceType) < 0) {
        ctx.throw(405, 'service not available');
      }

      ctx.set('content-type', `application/x-git-${service}-result`);

      if (!ctx.headers["authorization"]) {
        ctx.throw(401, null, {
          headers: {
            'Content-Type': 'text/plain',
            'WWW-Authenticate': 'Basic realm="authorization needed"'
          }
        });
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
        ctx.throw(401, 'Account verification failed!');
      }
      // ctx.body = ctx.req.pipe
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = err.message;
    }
  }
}