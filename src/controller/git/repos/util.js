const nodegit = require('nodegit');
const path = require('path');

// https://www.nodegit.org/api/object/#TYPE
// Object.TYPE.ANY -2
// Object.TYPE.BAD -1
// Object.TYPE.EXT1	0
// Object.TYPE.COMMIT	1
// Object.TYPE.TREE	2
// Object.TYPE.BLOB	3
// Object.TYPE.TAG	4
// Object.TYPE.EXT2	5
// Object.TYPE.OFS_DELTA	6
// Object.TYPE.REF_DELTA	7

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
      const typeNum = entry.type();
      switch (typeNum) {
        case -2: type = 'any'; break;
        case -1: type = 'bad'; break;
        case 0: type = 'ext1'; break;
        case 1: type = 'commit'; break; // submodules
        case 2: type = 'tree'; break; // directory
        case 3: type = 'blob'; break; // file
        case 4: type = 'tag'; break;
        case 5: type = 'ext2'; break;
        case 6: type = 'ofs_delta'; break;
        case 6: type = 'ref_delta'; break;
        default: break;
      }
      const props = {
        id: entry.sha(),
        name: entry.name(),
        path: entry.path(),
        mode: entry.filemode(),
        type,
      };
      // README 和 Submodule 需要单独处理
      if (entry.isSubmodule() || /readme.md$/.test(entry.path().toLocaleLowerCase())) {
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
  return [].concat(hiddenFolder, folder, hiddenFile, file);
}

exports.getEntrysInfo = (tree = [], repo) => {
  if (!tree || tree.length === 0) return [];
  return Promise.all(tree.map(async (item) => {
    const oid = await nodegit.Oid.fromString(item.id);
    // submodule
    if (item.type === 'commit') {
      let odb = await repo.odb();
      // odb = await odb.read(oid);
      // console.log('item:', item.entry.sha())
      // 过滤 entry 对象
      delete item.entry;
    } else {
      let odb = await repo.odb();
      odb = await odb.read(oid);
      const size = odb.size();
      item.size = size;
    }
    return item;
  })).catch((err) => {
    console.log('err:getEntrysInfo:', err);
  });
}

/**
 * 获取每个问文件的 hash 和 message
 * https://github.com/nodegit/nodegit/issues/1174
 * @param {Array} tree 每个文件的JSON对象
 * @param {Object} repo Nodegit 仓对象
 * @param {String} firstCommitOnMasterSha 仓库的第一个commit hash
 */
exports.getEntrysCommit = (tree = [], repo, firstCommitOnMasterSha) => {
  if (!tree || tree.length === 0) return [];
  return Promise.all(tree.map(async (item) => {
    const props = { ...item };
    if (item.path) {
      let root = null;
      const walk = repo.createRevWalk();
      try {
        walk.pushGlob('refs/heads/*');
        // walk.pushRef('refs/heads/master')
        // walk.pushHead()
        walk.sorting(nodegit.Revwalk.SORT.TIME, nodegit.Revwalk.SORT.REVERSE);
        await (async function step() {
          let oid = null;
          try {
            oid = await walk.next();
          } catch (error) {
            return;
          }
          if (oid == null) {
            return;
          }
          const commit = await nodegit.Commit.lookup(repo, oid)
          let entry = null;
          try {
            entry = await commit.getEntry(item.path);
          }
          catch (err) {
            if (err.errno !== -3) {
              throw err;
            }
          }
          if (entry != null) {
            root = commit;
            if (entry.oid() === item.id) {
              return;
            }
          }
          await step();
        })()
      }
      finally {
        walk.free();
      }
      const string = root.message();
      const sha = root.sha();
      props.message = string;
      props.sha = sha;
    }

    // if (item.path && (item.type === 'commit' || item.type === 'blob')) {
    //   // https://github.com/nodegit/nodegit/issues/220
    //   // 获取单个文件的提交
    //   const walker = await repo.createRevWalk();
    //   walker.push(firstCommitOnMasterSha);
    //   walker.sorting(nodegit.Revwalk.SORT.Time);
    //   const history = await walker.fileHistoryWalk(item.path, 500);
    //   history.forEach((entry, index) => {
    //     const commit = entry.commit;
    //     if (index === 0) {
    //       props.author = {};
    //       props.author.name = commit.author().name();
    //       props.author.email = commit.author().email();
    //       props.message = commit.message();
    //       props.sha = commit.sha();
    //       props.time = commit.time();
    //     }
    //   });
    // }

    // if (item.path === 'conf' && item.type === 'tree') {
    //   const treeEntrys = await repo.getTree(item.id);
    //   const treeEntry = treeEntrys.entryByIndex(0);
    //   const refreshIndex = await repo.refreshIndex();
    //   const indexEntryFolder = refreshIndex.getByPath(treeEntry.path());
    // }

    // const blob = await nodegit.Blob.lookup(repo, item.id);
    // // const rawsize = await blob.rawsize()
    // // const content = await blob.content()
    // // const owner = await blob.owner();
    return props;
  })).catch((err) => {
    console.log('err:getEntrysCommit:', err);
  });
}