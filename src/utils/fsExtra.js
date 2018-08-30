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


exports.readFile = async (path, charset = 'utf8') => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, charset, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
};