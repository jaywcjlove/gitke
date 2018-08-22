const fs = require('fs');

exports.exists = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, msg) => {
      err ? reject(err) : resolve(msg);
    });
  });
};

exports.existsRepo = (repoNamePath) => {
  return new Promise((resolve) => {
    fs.stat(repoNamePath, (err) => {
      err ? resolve(false) : resolve(true);
    });
  });
}