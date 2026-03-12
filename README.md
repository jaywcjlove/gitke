Gitke
=====

Gitke is a minimal Git hosting service built with Swift and Vapor. It targets a pragmatic MVP: repository hosting, Web browsing, Git Smart HTTP, an SSH gateway script, basic auth and permissions, and enough admin capability to run locally or deploy on a small server.

## Current Status

Implemented today:

- Repository storage under `REPO_ROOT/{owner}/{repo}.git`
- Web UI:
  - login/logout
  - repository list
  - create repository
  - repository detail
  - branch list page
  - commit history
  - tree browsing
  - blob viewing
  - README rendering
  - admin user CRUD
  - SSH key CRUD
- REST API:
  - auth login
  - repository CRUD/read APIs
  - branch/commit/tree/blob APIs
  - admin user CRUD APIs
  - SSH key CRUD APIs
- Git Smart HTTP via system `git http-backend`
- SSH gateway via OpenSSH + `Scripts/gitke-ssh-command.sh`
- Basic read/write permission model
- Audit log persistence for clone/fetch/push/create/delete

Not fully automated yet:

- SSH keys added in the Web UI are stored in the database, but they are not automatically synced into system `authorized_keys`
- SSH write authorization is still based on the OpenSSH entrypoint pattern, not a fully integrated ACL callback into Gitke

## Stack

- Swift 5.9+
- Vapor 4
- Fluent
- PostgreSQL for deployment
- SQLite for local development
- Leaf for server-rendered pages

## Project Layout

```text
gitke/
  Package.swift
  Sources/
    App/
      configure.swift
      routes.swift
      Controllers/
      Models/
      Migrations/
      Services/
      Middleware/
      Utils/
  Resources/
    Views/
  Public/
  Scripts/
  docker/
  README.md
```

## Implemented Features

### Repository Hosting

- Bare repositories are created on disk with:

```bash
git init --bare <REPO_ROOT>/<owner>/<repo>.git
```

- Current path convention:

```text
<REPO_ROOT>/admin/test.git
<REPO_ROOT>/owner/repo.git
```

### Web UI

Implemented pages:

- `/login`
- `/repos`
- `/repos/new`
- `/repos/:owner/:repo`
- `/repos/:owner/:repo/branches`
- `/repos/:owner/:repo/commits`
- `/repos/:owner/:repo/tree/:branch/...`
- `/repos/:owner/:repo/blob/:branch/...`
- `/admin/users`
- `/settings/ssh-keys`

### REST API

Implemented endpoints:

- `POST /api/auth/login`
- `POST /api/repos`
- `GET /api/repos`
- `GET /api/repos/:owner/:repo`
- `GET /api/repos/:owner/:repo/branches`
- `GET /api/repos/:owner/:repo/commits`
- `GET /api/repos/:owner/:repo/tree/:branch/*path`
- `GET /api/repos/:owner/:repo/blob/:branch/*path`
- `DELETE /api/repos/:owner/:repo`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/ssh-keys`
- `POST /api/ssh-keys`
- `PUT /api/ssh-keys/:id`
- `DELETE /api/ssh-keys/:id`

### Git Smart HTTP

Supported routes:

- `GET /owner/repo.git/info/refs?service=git-upload-pack`
- `POST /owner/repo.git/git-upload-pack`
- `GET /owner/repo.git/info/refs?service=git-receive-pack`
- `POST /owner/repo.git/git-receive-pack`

Implementation strategy:

- Vapor receives the request
- Gitke validates repository visibility and user permissions
- Gitke invokes system `git http-backend`
- CGI headers/body are mapped back into a normal HTTP response

### SSH

Gitke does not implement the SSH protocol itself. It relies on OpenSSH plus a gateway script:

- [gitke-ssh-command.sh](/Users/wong/git/github/gitke/Scripts/gitke-ssh-command.sh)

The script:

- reads `SSH_ORIGINAL_COMMAND`
- allows only `git-upload-pack` and `git-receive-pack`
- resolves repository paths relative to `REPO_ROOT`
- validates the path format
- executes the system Git server command

This supports the standard Git SSH shape:

```bash
git clone git@host:owner/repo.git
git push git@host:owner/repo.git master
```

provided your OpenSSH user, `authorized_keys`, and `REPO_ROOT` are configured correctly.

## Development Mode

Local development defaults are intentionally different from server deployment.

### Local defaults

If `REPO_ROOT` is not set, Gitke uses:

```text
<project-root>/data/git/repositories
```

This is the current safe local default because writing to `/data/git/repositories` usually fails on macOS and many developer machines.

If `DATABASE_URL` is not set, Gitke uses:

```text
<project-root>/db.sqlite
```

### Start in development mode

Run from the repository root:

```bash
cd /Users/wong/git/github/gitke
swift build
swift run App migrate
swift run App serve --hostname 0.0.0.0 --port 2018
```

Then create the first admin:

```bash
./Scripts/create_admin.sh admin admin123456
```

Open:

- `http://127.0.0.1:2018/login`

### Development with explicit local paths

Recommended on macOS:

```bash
cd /Users/wong/git/github/gitke
unset DATABASE_URL
export REPO_ROOT=/Users/wong/git/github/gitke/data/git/repositories
swift run App migrate
swift run App serve --hostname 0.0.0.0 --port 2018
```

### Development with PostgreSQL

```bash
cd /Users/wong/git/github/gitke
export DATABASE_URL='postgres://gitke:gitke@127.0.0.1:5432/gitke'
export REPO_ROOT=/Users/wong/git/github/gitke/data/git/repositories
swift run App migrate
swift run App serve --hostname 0.0.0.0 --port 2018
```

Important:

- If you switch from SQLite to PostgreSQL, repositories on disk do not automatically create repository rows in the new database
- If HTTP clone shows `repository not found` while the `.git` directory exists, the usual cause is that the running app is using a different database than the one where the repository record was created

## Core Configuration

Environment variables:

- `HOST`
- `PORT`
- `REPO_ROOT`
- `DATABASE_URL`
- `SQLITE_PATH`
- `PUBLIC_HTTP_BASE`
- `PUBLIC_SSH_BASE`

Typical values:

```bash
export HOST=0.0.0.0
export PORT=2018
export REPO_ROOT=/Users/wong/git/github/gitke/data/git/repositories
export PUBLIC_HTTP_BASE=http://127.0.0.1:2018
export PUBLIC_SSH_BASE=git@127.0.0.1
```

## Common Development Workflow

1. Start the app.
2. Create the first admin.
3. Log in to the Web UI.
4. Create a public repository from `/repos/new`.
5. Verify the repository appears in `/repos`.
6. Test HTTP clone.
7. Configure SSH separately if you need `git@host:owner/repo.git`.

Example:

```bash
git clone http://127.0.0.1:2018/admin/test.git
git fetch http://127.0.0.1:2018/admin/test.git
git push http://admin:password@127.0.0.1:2018/admin/test.git master

git clone git@127.0.0.1:admin/scap.git
git clone wong@10.102.1.82:admin/scap.git
```

## SSH Setup

Relevant files:

- [sshd_config.example](/Users/wong/git/github/gitke/Scripts/sshd_config.example)
- [authorized_keys.example](/Users/wong/git/github/gitke/Scripts/authorized_keys.example)
- [gitke-ssh-command.sh](/Users/wong/git/github/gitke/Scripts/gitke-ssh-command.sh)

Recommended `authorized_keys` pattern:

```bash
command="REPO_ROOT=/Users/wong/git/github/gitke/data/git/repositories /Users/wong/git/github/gitke/Scripts/gitke-ssh-command.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... user@example
```

What this means:

- SSH public key auth must succeed first
- then OpenSSH invokes `gitke-ssh-command.sh`
- the script maps `owner/repo.git` into `${REPO_ROOT}/owner/repo.git`

### SSH troubleshooting

- `Connection refused`
  - SSH is not listening on port 22
- `Password:` prompt appears
  - your SSH public key is not being accepted
  - Gitke database SSH keys do not automatically configure OpenSSH
- `Connection closed by <host> port 22`
  - the gateway script ran and exited, or OpenSSH closed the session after auth policy failure
- `does not appear to be a git repository`
  - you reached the remote shell, but it did not map `owner/repo.git` into your real `REPO_ROOT`
- absolute path clone works but `git@host:owner/repo.git` does not
  - repository exists
  - SSH forced command or user mapping is still wrong

Useful local simulation:

```bash
cd /Users/wong/git/github/gitke
SSH_ORIGINAL_COMMAND="git-upload-pack 'admin/scap.git'" \
REPO_ROOT="/Users/wong/git/github/gitke/data/git/repositories" \
./Scripts/gitke-ssh-command.sh
```

## Docker

Build and run:

```bash
cd /Users/wong/git/github/gitke/docker
docker compose up --build
```

Containers:

- `gitke`
- `postgres`

References:

- [Dockerfile](/Users/wong/git/github/gitke/docker/Dockerfile)
- [docker-compose.yml](/Users/wong/git/github/gitke/docker/docker-compose.yml)

## Security Model

- repository owner can write
- admin can manage all repositories
- public repositories allow anonymous HTTP read
- private repositories require authentication
- passwords and access tokens are stored as hashes
- shell commands use argument arrays instead of shell string interpolation
- repository names are validated to prevent path traversal

## Important Source Files

Application and routing:

- [configure.swift](/Users/wong/git/github/gitke/Sources/App/configure.swift)
- [routes.swift](/Users/wong/git/github/gitke/Sources/App/routes.swift)

Controllers:

- [AuthController.swift](/Users/wong/git/github/gitke/Sources/App/Controllers/AuthController.swift)
- [RepositoryController.swift](/Users/wong/git/github/gitke/Sources/App/Controllers/RepositoryController.swift)
- [GitHTTPController.swift](/Users/wong/git/github/gitke/Sources/App/Controllers/GitHTTPController.swift)
- [UserController.swift](/Users/wong/git/github/gitke/Sources/App/Controllers/UserController.swift)
- [SSHKeyController.swift](/Users/wong/git/github/gitke/Sources/App/Controllers/SSHKeyController.swift)

Services:

- [GitService.swift](/Users/wong/git/github/gitke/Sources/App/Services/GitService.swift)
- [AuthService.swift](/Users/wong/git/github/gitke/Sources/App/Services/AuthService.swift)
- [PermissionService.swift](/Users/wong/git/github/gitke/Sources/App/Services/PermissionService.swift)
- [AuditService.swift](/Users/wong/git/github/gitke/Sources/App/Services/AuditService.swift)

## Build Verification

Last verified locally with:

```bash
cd /Users/wong/git/github/gitke
swift build --scratch-path /tmp/gitke-build
```
