module.exports = (app) => {
  app.use(require('./user').routes());
}