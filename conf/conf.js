const PATH = require('path');
const toml = require('toml');
const FS = require('fs-extra');
const home = require('os-homedir');

const rootpath = PATH.join(home(), '.gitke-data');

function getTomlConf(_rootPath) {
  const confPath = PATH.join(__dirname, '..', 'conf', 'conf.toml');
  let tomlStr = FS.readFileSync(confPath, 'utf8');
  return tomlStr.replace(/\{\{rootpath\}\}/g, _rootPath);
}

module.exports = (() => {
  const confStr = getTomlConf(rootpath);
  const userConf = PATH.join(rootpath, 'conf.toml');
  FS.ensureDir(rootpath);
  if (!FS.pathExistsSync(userConf)) {
    FS.outputFileSync(userConf, confStr);
  }

  let tomlStr = FS.readFileSync(userConf, 'utf8');
  return toml.parse(tomlStr)
})();