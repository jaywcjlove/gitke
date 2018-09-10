const nodegit = require('nodegit');
const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);

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
 * 获取所有文件，对应在Tree下面最新的提交信息
 *
 * @param {String} repoPath 仓库路径
 * @param {String} branch 仓当前 ref
 * @param {Array} data 目录数组
 */
exports.getFilesCommitInfo = async (repoPath, branch, data) => {
  return Promise.all(data.map(async (item) => {
    const props = { ...item };
    const commit = await this.getFileCommit(repoPath, item.path, branch);
    props.message = commit.message;
    props.treehash = commit.hash;
    props.committer = commit.committer;
    return props;
  })).catch((err) => {
    throw new Error(`Can't get commit, ${err}`);
  });;
}

/**
 * 获取某个路径的提交信息
 * 输出内容：https://git-scm.com/docs/git-log#_pretty_formats
 * 输出commit的总数：git rev-list --all --count
 * 通过hash查看内容：git --no-pager show 5b9cf7 --summary --pretty="%H"
 *
 * @param {String} repoPath 仓地址
 * @param {String} relPath 文件在仓中的路径
 * @param {String} ref ref ?= master
 */
exports.getFileCommit = async (repoPath, relPath, ref = "master") => {
  try {
    const format = '\n=>[hash]:%H\n=>[parentHashes]:%P\n=>[shortHash]:%h\n=>[treeHash]:%T\n=>[author-name]:%an\n=>[author-email]:%ae\n=>[author-relativedate]:%ar\n=>[author-timestamp]:%at\n=>[committer-name]:%cn\n=>[committer-email]:%ce\n=>[committer-relativedate]:%cr\n=>[committer-timestamp]:%ct\n=>[message]:%s';
    const { stdout } = await exec(`git rev-list --pretty="${format}" --max-count=1 ${ref} -- ${relPath}`, {
      cwd: repoPath,
    });
    const data = {};
    stdout.split('\n=>').forEach((item) => {
      if (/^\[/.test(item)) {
        let key = item.match(/[^\[]([^\[]*)(?=\]\:)/ig);
        const value = item.replace(/^\[.*\]:/, '');
        if (key.length > 0 && value) {
          key = key[0];
          if (key && key.includes('-')) {
            key = key.split('-');
            if (!data[key[0]]) data[key[0]] = {};
            data[key[0]][key[1]] = value;
          } else {
            data[key] = value;
          }
        }
      }
    });
    return data;
  } catch (error) {
    throw new Error(`Can't get commit, ${error}`);
  }
}

/**
 * 获取每个问文件的 hash 和 message
 * [弃用]: 在大仓库下性能低下
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

    return props;
  })).catch((err) => {
    console.log('err:getEntrysCommit:', err);
  });
}
