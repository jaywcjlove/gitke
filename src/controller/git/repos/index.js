const Git = require("nodegit");
const PATH = require("path");
const FS = require('fs-extra')
const Models = require('../../../../conf/sequelize');
const { readFile } = require('../../../utils/fsExtra');

/**
 * 获取目录
 * @param {Object} treeWalker 
 * @param {Boolean} [recursive=false] 以广度优先顺序递归地遍历树。
 */
const getFiles = (treeWalker, recursive = false) => {
  const trees = [];
  return new Promise((resolve, reject) => {
    treeWalker.on("entry", (entry) => {
      let type = '';
      if (entry.isBlob()) type = 'blob';
      if (entry.isDirectory()) type = 'tree';
      if (entry.isSubmodule()) type = 'commit';
      trees.push({
        id: entry.sha(),
        name: entry.name(),
        path: entry.path(),
        filemodeRaw: entry.filemodeRaw(),
        mode: entry.filemode(),
        type,
      });
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

module.exports = {
  created: async (ctx) => {
    const { name } = ctx.request.body;
    const { userInfo } = ctx.session;
    let transaction;
    try {
      // 托管事务
      transaction = await Models.sequelize.transaction();
      const namespaces = await Models.namespaces.findOne({
        where: { owner_id: userInfo.id },
        transaction,
      });
      if (!namespaces) ctx.throw(404, 'The namespace does not exist.');

      const bodyData = ctx.request.body;
      if (!bodyData.path) bodyData.path = name;
      bodyData.creator_id = ctx.session.userInfo.id;
      bodyData.namespace_id = namespaces.id;
      // 创建仓库信息
      const projects = await Models.projects.create(bodyData, { transaction });
      const { reposPath } = ctx.state.conf;
      // 验证仓库是否存在
      const currentPath = PATH.join(reposPath, namespaces.path, `${name}.git`);
      const pathExists = await FS.pathExists(currentPath);
      if (pathExists) ctx.throw(423, `Repos ${name} already exists!`);
      // 初始化一个仓库
      await Git.Repository.init(currentPath, 1);
      // 生成钩子脚本
      // "pre-receive":  "#!/usr/bin/env %s\n\"%s\" hook --config='%s' pre-receive\n",
      // "update":       "#!/usr/bin/env %s\n\"%s\" hook --config='%s' update $1 $2 $3\n",
      // "post-receive": "#!/usr/bin/env %s\n\"%s\" hook --config='%s' post-receive\n",
      // transaction commit 事务提交
      await transaction.commit();
      ctx.body = projects
    } catch (err) {
      // 事务回滚
      await transaction.rollback();
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  list: async (ctx) => {
    const { username } = ctx.params;
    let { page = 1, limit = 10 } = ctx.request.query
    page = parseInt(page || 1, 10);
    limit = parseInt(limit || 10, 10);
    const offset = (page - 1) * limit;
    const params = { limit, offset, order: [['id', 'DESC']] };
    params.where = { ...ctx.request.query };
    delete params.where.limit;
    delete params.where.page;
    params.include = [{
      model: Models.users,
      as: 'owner',
      attributes: { exclude: ['password'] }
    }, {
      model: Models.namespaces,
      as: 'namespace',
    }];
    try {
      const users = await Models.users.findOne({ where: { username } });
      if (!users) ctx.throw(404, `Username ${username} does not exist`);
      params.where.creator_id = users.id;
      const data = await Models.projects.findAndCount(params);
      const pages = parseInt((data.count + limit - 1) / limit); // 总页数
      ctx.body = { page, pages, limit, ...data }
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  orgReposList: async (ctx) => {
    const { username } = ctx.params;
  },
  detail: async (ctx) => {
    const { owner, repo } = ctx.params;
    try {
      const namespaces = await Models.namespaces.findOne({ where: { name: owner } });
      if (!namespaces) ctx.throw(404, `Owner ${owner} does not exist`);
      const repoDetail = await Models.projects.findOne({
        where: { namespace_id: namespaces.id, name: repo },
        include: [{ model: Models.users, as: 'owner', attributes: { exclude: ['password'] } }]
      });
      if (!repoDetail) ctx.throw(404, `Repo ${owner}/${repo} does not exist`);
      const { reposPath } = ctx.state.conf;
      const currentRepoPath = PATH.join(reposPath, owner, `${repo}.git`);
      const gitRepo = await Git.Repository.open(currentRepoPath);
      repoDetail.setDataValue('isEmpty', gitRepo.isEmpty());
      ctx.body = repoDetail;
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  readme: async (ctx) => {
    const { owner, repo } = ctx.params;
    const { reposPath } = ctx.state.conf;
    const { userInfo } = ctx.session;
    const currentRepoPath = PATH.join(reposPath, owner, `${repo}.git`);
    try {
      const gitRepo = await Git.Repository.open(currentRepoPath);
      let emptyRepoReadme = await readFile(PATH.join(__dirname, 'EmptyRepo.md'));
      if (gitRepo.isEmpty() === 1) {
        if (userInfo.username !== owner) emptyRepoReadme = '';
        if (userInfo.username === owner) {
          emptyRepoReadme = emptyRepoReadme
            .replace(/\{\{username\}\}/g, owner)
            .replace(/\{\{repos\}\}/g, repo)
            .replace(/\{\{host\}\}/g, ctx.hostname)
            .replace(/\{\{email\}\}/g, userInfo.email)
        }
        ctx.body = { content: emptyRepoReadme };
        return;
      }
      let refCommit = await gitRepo.getReferenceCommit('refs/heads/master');
      refCommit = await gitRepo.getCommit(refCommit.sha());
      refCommit = await refCommit.getEntry("README.md");
      refCommit = await refCommit.getBlob();
      ctx.body = { content: refCommit.toString() };
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  reposTree: async (ctx) => {
    const { id } = ctx.params;
    let { recursive = false, branch } = ctx.request.query
    console.log('ctx.params:', ctx.request.query)
    try {
      const projects = await Models.projects.findOne({
        where: { id },
        include: [{
          model: Models.users,
          as: 'owner',
          attributes: { exclude: ['password'] }
        }, {
          model: Models.namespaces,
          as: 'namespace',
        }],
      });
      if (!projects) ctx.throw(404, `Owner ${id} does not exist`);

      const { reposPath } = ctx.state.conf;
      const currentRepoPath = PATH.join(reposPath, projects.namespace.name, `${projects.name}.git`);
      const gitRepo = await Git.Repository.open(currentRepoPath);
      if (gitRepo.isEmpty() === 1) {
        ctx.body = { tree: [] };
        return;
      }
      let commit;
      if (branch) {
        commit = await gitRepo.getReferenceCommit(branch);
      } else {
        commit = await gitRepo.getMasterCommit();
      }

      console.log('~~~:', commit);
      const body = {}
      body.sha = commit.sha();
      // body.toString = commit.toString();
      body.summary = commit.summary();
      body.message = commit.message();
      body.messageRaw = commit.messageRaw();
      body.messageEncoding = commit.messageEncoding();
      body.owner = {
        free: commit.author().free(),
        name: commit.author().name(),
        email: commit.author().email(),
      };
      body.amend = commit.amend();
      body.body = commit.body();
      body.time = commit.time();
      body.date = commit.date();
      body.timeMs = commit.timeMs();
      body.timeOffset = commit.timeOffset();

      // const treeId = Git.Oid.fromString('5d08433fcb6ecbfe3d1709013452f3d41ffa1ced');
      const treeId = Git.Oid.fromString(body.sha);
      commit = await commit.getTree(treeId);
      
      let test = await commit.getEntry("conf");
      test = await test.getTree('5d08433fcb6ecbfe3d1709013452f3d41ffa1ced');
      // test = test.getTree('5d08433fcb6ecbfe3d1709013452f3d41ffa1ced')
      // commit = await (commit ? commit.getTree() : Git.Tree.lookup(gitRepo, emptyTree));
      // const imagesTree = commit.entryByPath('conf')
      // console.log('~~~>>>>', imagesTree.__proto__)
      // console.log('~~~>>commit>>', test.__proto__)

      // test = await test.toObject(gitRepo);
      console.log('~~~>>test>>', test.__proto__)
      console.log('~~~>>test>>', test.path())
      console.log('~~~>>commit>>', commit.__proto__)
      // console.log('~~~>>commit>>', test.path())

      commit = test;


      // console.log('~~~>>>>', commit.path())
      body.path = commit.path();
      body.entryCount = commit.entryCount();
      commit = await commit.walk(recursive);
      body.tree = await getFiles(commit, recursive);
      ctx.body = body;
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
}
