Gitke
---

```bash
git push git@192.168.188.250:owner/repo.git master
git clone ssh://root@123.123.123.123/opt/my-first-app.git
git clone http://username:password@127.0.0.1:2018/owner/repo.git
git clone http://127.0.0.1:2018/admin/test.git test
git fetch http://127.0.0.1:2018/admin/test.git test
```

## Git Protocols and APIs

Serving content of a file in a git repo.

The requested file is specified by:

* `{owner}`: GitHub organization or user
* `{repo}`: repository name
* `{ref}`: Git reference
  * branch name (e.g. `master`)
  * tag name (e.g. `v1.0`)

## Gitke URLs:

* `https://localhost:2018/{owner}/{repo}/raw/{ref}/path/to/file`

Remote examples:

* http://localhost:2018/admin/gitke/raw/master/README.md

## Git HTTP Transfer Protocols

- [Git Internals - Transfer Protocols](https://git-scm.com/book/en/v2/Git-Internals-Transfer-Protocols)
- [HTTP transfer protocols](https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt)
- [Documentation Common to Pack and Http Protocols](https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt)

