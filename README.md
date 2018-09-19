Gitke
---

## Install

```bash
sudo npm install -g gitke --unsafe-perm # running as root
# Run the server
gitke
# Open your browser and visit http://localhost:2018/
```

```bash
git push git@192.168.188.250:owner/repo.git master
git clone ssh://root@123.123.123.123/opt/my-first-app.git
git clone http://username:password@127.0.0.1:2018/owner/repo.git
git clone http://127.0.0.1:2018/admin/test.git test
git fetch http://127.0.0.1:2018/admin/test.git test
```

## Git APIs

Serving content of a file in a git repo.

The requested file is specified by:

* `{owner}`: GitHub organization or user
* `{repo}`: repository name
* `{ref}`: Git reference
  * branch name (e.g. `master`)
  * tag name (e.g. `v1.0`)

## Gitke URLs:

* `https://localhost:2018/{owner}/{repo}/raw/{ref}/path/to/file`
* `http://localhost:2018/admin/gitke/raw/master/README.md`

## Git HTTP Transfer Protocols

- [Git Internals - Transfer Protocols](https://git-scm.com/book/en/v2/Git-Internals-Transfer-Protocols)
- [HTTP transfer protocols](https://github.com/git/git/blob/master/Documentation/technical/http-protocol.txt)
- [Documentation Common to Pack and Http Protocols](https://github.com/git/git/blob/master/Documentation/technical/protocol-common.txt)


## Development

```bash
git clone https://github.com/jaywcjlove/gitke.git
sudo npm install --unsafe-perm # running as root
# Or
sudo yarn install 
# Run the app
# Restart the app automatically every time code changes. 
# Useful during development.
npm run dev
```

Open your browser and visit http://localhost:2018/

## License

The MIT License (MIT)
