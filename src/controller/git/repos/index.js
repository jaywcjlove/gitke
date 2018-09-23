const Git = require("nodegit");
const PATH = require("path");
const FS = require('fs-extra')
const Models = require('../../../../conf/sequelize');
const { readFile, removeDir } = require('../../../utils/fsExtra');

const { getFiles, repoFilesSort, getEntrysInfo, getFilesCommitInfo, getFileCommit } = require('./util');

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
      // 记录用户创建的仓库
      await Models.user_interacted_projects.create({ project_id: projects.id, creator_id: bodyData.creator_id }, { transaction });
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
    const currentRepoPath = PATH.join(reposPath, owner, `${repo}.git`);
    try {
      const gitRepo = await Git.Repository.open(currentRepoPath);
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
  fileDetail: async (ctx) => {
    const { owner, repo, ref } = ctx.params;
    const { reposPath } = ctx.state.conf;
    const currentRepoPath = PATH.join(reposPath, owner, `${repo}.git`);
    const filePath = ctx.params[0];
    try {
      const porps = {};
      const gitRepo = await Git.Repository.open(currentRepoPath);
      const reqRef = await gitRepo.getReference(ref);
      const obj = await reqRef.peel(Git.Object.TYPE.COMMIT);
      const commitlookup = await Git.Commit.lookup(gitRepo, obj.id());
      const tree = await commitlookup.getTree();
      const entry = await tree.getEntry(filePath);
      porps.id = entry.oid();
      porps.ref = reqRef.name();
      const commit = await getFileCommit(currentRepoPath, filePath, ref);
      const blob = await entry.getBlob();
      ctx.body = {
        ...porps,
        ...commit,
        content: blob.toString(),
        parsePath: PATH.parse(filePath),
        path: filePath,
        has: blob.id,
        refName: blob.id,
        filemode: blob.filemode(),
        rawsize: blob.rawsize(),
      }
      blob.free();
      tree.free();
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  delete: async (ctx) => {
    const { owner } = ctx.params;
    let { repo } = ctx.params;
    const { reposPath } = ctx.state.conf;
    repo = repo.replace(/.git$/, '');
    let transaction;
    try {
      // 托管事务
      transaction = await Models.sequelize.transaction();
      const namespaces = await Models.namespaces.findOne({ where: { name: owner }, transaction });
      if (!namespaces || !namespaces.id) ctx.throw(404, 'Owner does not exist!');
      const projects = await Models.projects.findOne({ where: { name: repo, namespace_id: namespaces.id }, transaction });
      if (!projects || !projects.id) ctx.throw(404, 'Repo does not exist!');
      // 删除用户创建仓库的记录
      await Models.user_interacted_projects.destroy({ where: { project_id: projects.id, creator_id: namespaces.owner_id }, transaction });
      // 删除仓库信息
      await Models.projects.destroy({ where: { name: repo }, transaction });
      // remove repo
      await removeDir(PATH.join(reposPath, owner, `${repo}.git`));
      // transaction commit 事务提交
      await transaction.commit();
      ctx.body = { message: `Successfully deleted ${repo}!`};
    } catch (err) {
      // 事务回滚
      if (transaction) await transaction.rollback();
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
  reposTree: async (ctx) => {
    const { id } = ctx.params;
    const { userInfo } = ctx.session;
    let { recursive = false, branch = 'master' } = ctx.query;
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

      const repoDetail = await Models.projects.findOne({
        where: { id },
        include: [{ model: Models.users, as: 'owner', attributes: { exclude: ['password'] } }]
      });
      const { reposPath } = ctx.state.conf;
      const currentRepoPath = PATH.join(reposPath, projects.namespace.name, `${projects.name}.git`);
      const gitRepo = await Git.Repository.open(currentRepoPath);
      // 空仓库返回 README.md 说明内容
      let emptyRepoReadme = await readFile(PATH.join(__dirname, 'EmptyRepo.md'));
      if (gitRepo.isEmpty() === 1) {
        if (userInfo.username !== repoDetail.owner.username) emptyRepoReadme = '';
        if (userInfo.username === repoDetail.owner.username) {
          emptyRepoReadme = emptyRepoReadme
            .replace(/\{\{username\}\}/g, repoDetail.owner.username)
            .replace(/\{\{repos\}\}/g, repoDetail.name)
            .replace(/\{\{host\}\}/g, ctx.hostname)
            .replace(/\{\{email\}\}/g, userInfo.email)
        }
        ctx.body = { tree: [], readmeContent: emptyRepoReadme };
        return;
      }
      let commit = await gitRepo.getReferenceCommit(branch);
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
      body.isFile = false;

      // const treeId = Git.Oid.fromString('5d08433fcb6ecbfe3d1709013452f3d41ffa1ced');
      const treeId = Git.Oid.fromString(body.sha);
      commit = await commit.getTree(treeId);

      // 参数 path 处理，存储库中的路径
      if (ctx.query.path) {
        body.parsePath = PATH.parse(ctx.query.path);
        let treeObj = await commit.getEntry(ctx.query.path);
        if (treeObj.isFile()) {
          // try {
          //   // repo.getCommit("bf1da765e357a9b936d6d511f2c7b78e0de53632");
          //   // const commit = await Git.Commit.lookup(gitRepo, treeObj.oid())
          //   const commits = await gitRepo.getCommit(treeObj.oid())
          //   console.log('entry:', commits.__proto__)
          // } catch (error) {
          //   console.log('error:', error)
          // }
          const entry = await commit.getEntry(treeObj.path());
          const local = await treeObj.toObject(gitRepo)
          // const aa = await local.lookupByPath(treeObj.path(), Git.Object.TYPE.BLOB)
          // console.log('treeObj:', treeObj.__proto__)
          // console.log('local:', local.__proto__)
          // console.log('local:', local.owner())
          // console.log('local:', local.lookupByPath(treeObj.path(), Git.Object.TYPE.BLOB))
          // console.log('treeObj:', treeObj.path())
          const blob = await Git.Blob.lookup(gitRepo, treeObj.oid());
          body.rawsize = blob.rawsize();
          body.readmeContent = blob.content().toString();
          body.isFile = true;
          body.path = ctx.query.path;
          body.tree = [];
          ctx.body = body;
          blob.free()
          return;
        }
        treeObj = await treeObj.getTree(treeObj.sha());
        commit = treeObj;
      }

      body.path = commit.path();
      body.entryCount = commit.entryCount();
      body.readmeContent = ''; // 默认目录下的 README.md 文件内容为空
      commit = await commit.walk(recursive);
      const treeArray = await getFiles(commit, recursive);
      const oldTree = [...treeArray];
      // 目录文件排序
      let treeCommit = repoFilesSort([...oldTree]);
      // 获取 个文件的信息
      treeCommit = await getEntrysInfo(treeCommit, gitRepo, currentRepoPath);
      // 获取每个文件的 Commit 信息，性能低下暂不做处理
      // treeCommit = await getEntrysCommit(treeCommit, gitRepo, body.sha);
      // 性能显著提高
      treeCommit = await getFilesCommitInfo(currentRepoPath, branch, treeCommit);
      body.tree = treeCommit;
      ctx.body = body;
    } catch (err) {
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.body = { message: err.message, ...err }
    }
  },
}
