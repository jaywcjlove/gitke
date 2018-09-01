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

// function mySorter(a, b) {
//   if (/^\d/.test(a) ^ /^\D/.test(b)) return a > b ? 1 : (a == b ? 0 : -1);
//   return a > b ? -1 : (a == b ? 0 : 1);
// }
// const pyArray = ["a", "d", "fa", "5", "t", "fw2", "a31", "b", "e", "2fs", "4", "0"]

/**
 * Nodegit 返回的目录对象，进行排序
 * 1. 隐藏文件夹，排在第一位
 * 2. 文件夹，排在第二位
 * 3. 隐藏文件，排第三位
 * 4. 文件，排第四位
 * @param {Array} tree 
 */
exports.repoFilesSort = (tree = []) => {
  const hiddenFolder = tree.filter(_item => /^\./.test(_item.name) && /^(tree|commit)$/.test(_item.type));
  const folder = tree.filter(_item => !/^\./.test(_item.name) && /^(tree|commit)$/.test(_item.type));
  const hiddenFile = tree.filter(_item => /^\./.test(_item.name) && /^(blob)$/.test(_item.type));
  const file = tree.filter(_item => !/^\./.test(_item.name) && /^(blob)$/.test(_item.type));
  console.log('tree:', file);
  return [].concat(hiddenFolder, folder, hiddenFile, file);
}