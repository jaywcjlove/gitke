
const Git = require('nodegit');
const mime = require('mime');
const PATH = require('path');

/**
 * Returns a blob resolved either from the specified tree or an uncommitted local file.
 *
 * @param {Git.Repository} repo Repository instance
 * @param {Git.Tree} tree Tree instance
 * @param {string} filePath path of file relative to the repository root
 * @param {boolean} serveUncommitted true if uncommitted changes should be returned, otherwise false
 * @returns {Promise<Git.Blob>} the resolved Blob instance
 */
async function resolveBlobFromTree(repo, tree, filePath, serveUncommitted) {
  const blob = await tree.getEntry(filePath)
    .then(entry => entry.getBlob())
    .catch(() => null);
  const localBlob = serveUncommitted ? await Git.Blob.createFromWorkdir(repo, filePath)
    .then(oid => Git.Blob.lookup(repo, oid))
    .catch(() => null) : null;

  // issue: check for uncommitted local changes
  // issue: serve newly created uncommitted files
  // issue: only serve uncommitted content if currently
  //             checked-out and requested refs match
  if (blob && localBlob) {
    if (!localBlob.id().equal(blob.id())) {
      // serve local file
      return localBlob;
    }
    return blob;
  }
  if (!blob && !localBlob) {
    const err = new Error(`file not found: ${filePath}`);
    err.errno = -3;
    return Promise.reject(err);
  }
  return Promise.resolve(blob || localBlob);
}



/**
 * Determines whether dirty, i.e. uncommitted content should be delivered (issue #187).
 *
 * @param {Git.Repository} repo Repository instance
 * @param {Git.Reference} headRef HEAD reference (currently checked out branch or tag)
 * @param {Git.Reference} reqRef requested reference (branch or tag)
 */
function serveUncommittedContent(repo, headRef, reqRef) {
  // serve dirty content only if currently checked out and requested refs match
  return !repo.isBare() && !headRef.cmp(reqRef);
}

async function rawHandler(ctx, next) {
  const { owner } = ctx.params;
  const repoName = ctx.params.repo;
  const refName = ctx.params.ref;
  let fpath = ctx.params[0];

  let serveUncommitted = false;

  const { reposPath } = ctx.state.conf;
  const currentRepoPath = PATH.join(reposPath, owner, `${repoName}.git`);
  const repo = await Git.Repository.open(currentRepoPath);

  const headRef = await repo.head();

  const reqRef = await repo.getReference(refName);
  serveUncommitted = serveUncommittedContent(repo, headRef, reqRef);

  const obj = await reqRef.peel(Git.Object.TYPE.COMMIT);
  const commitlookup = await Git.Commit.lookup(repo, obj.id());
  // const annCommit = await Git.AnnotatedCommit.fromRevspec(repo, refName)
  // const commit = await repo.getCommit(annCommit.id())
  const tree = await commitlookup.getTree();
  const blob = await resolveBlobFromTree(repo, tree, fpath, serveUncommitted)

  const mimeType = mime.getType(fpath) || 'text/plain';
  const sha1 = blob.id().tostrS();

  ctx.set({
    'Content-Type': `${mimeType}; charset=UTF-8`,
    ETag: sha1,
    // TODO: review cache-control header
    'Cache-Control': 'max-age=0, private, must-revalidate',
  });
  ctx.body = blob.content();
}

module.exports = rawHandler;
