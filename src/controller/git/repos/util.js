/**
 * Nodegit entries 获取目录
 * @param {Object} treeWalker 
 * @param {Boolean} [recursive=false] 以广度优先顺序递归地遍历树。
 */
exports.getFiles = (treeWalker, recursive = false) => {
  const trees = [];
  return new Promise((resolve, reject) => {
    treeWalker.on("entry", (entry) => {
      let type = '';
      if (entry.isBlob()) type = 'blob';
      if (entry.isDirectory()) type = 'tree';
      if (entry.isSubmodule()) type = 'commit';
      const props = {
        id: entry.sha(),
        name: entry.name(),
        path: entry.path(),
        // filemodeRaw: entry.filemodeRaw(),
        mode: entry.filemode(),
        type,
      };
      if (/readme.md$/.test(entry.path().toLocaleLowerCase())) {
        props.entry = entry;
      }
      trees.push(props);
    });
    treeWalker.on("end", (entries) => {
      if (recursive) resolve(trees);
    });
    treeWalker.on("error", (error) => {
      reject(error)
    });
    treeWalker.start();
    if (!recursive) resolve(trees);
  });
}