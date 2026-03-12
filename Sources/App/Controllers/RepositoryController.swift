import Fluent
import Vapor

struct RepositoryController {
    private let git = GitService()
    private let authService = AuthService()
    private let permission = PermissionService()
    private let audit = AuditService()
    private let markdown = MarkdownService()

    struct RepoListItem: Encodable {
        let name: String
        let owner: String
        let visibility: String
        let updatedAt: String
    }

    struct RepoListContext: Encodable {
        let username: String
        let repos: [RepoListItem]
    }

    struct RepoDetailContext: Encodable {
        let owner: String
        let repo: String
        let description: String?
        let visibility: String
        let defaultBranch: String
        let httpCloneURL: String
        let sshCloneURL: String
        let branches: [String]
        let commits: [CommitResponse]
        let tree: [TreeEntryResponse]
        let readmeHTML: String?
    }

    struct BranchItem: Encodable {
        let name: String
        let isDefault: Bool
        let latestMessage: String
        let latestAuthor: String
        let latestDate: String
    }

    struct BranchesContext: Encodable {
        let owner: String
        let repo: String
        let defaultBranch: String
        let branches: [BranchItem]
    }

    struct CommitsContext: Encodable {
        let owner: String
        let repo: String
        let branch: String
        let commits: [CommitResponse]
    }

    struct CommitDetailContext: Encodable {
        let owner: String
        let repo: String
        let branch: String
        let commit: CommitResponse
        let files: [CommitFileChangeResponse]
        let diff: String
    }

    struct TreeContext: Encodable {
        let owner: String
        let repo: String
        let branch: String
        let path: String
        let entries: [TreeEntryResponse]
    }

    struct BlobContext: Encodable {
        let owner: String
        let repo: String
        let branch: String
        let path: String
        let isBinary: Bool
        let content: String?
    }

    struct CreateRepoForm: Content {
        let name: String
        let description: String?
        let visibility: String
        let initReadme: String?
        let initGitignore: String?
    }

    struct RepoCreatePageContext: Encodable {
        let error: String?
    }

    @Sendable
    func listPage(req: Request) async throws -> View {
        let user = try await currentUser(req)
        let repos = try await listRepositoriesFor(user: user, req: req)
        let fmt = ISO8601DateFormatter()
        let items = repos.map {
            RepoListItem(
                name: $0.name,
                owner: $0.owner.username,
                visibility: $0.visibility.rawValue,
                updatedAt: $0.updatedAt.map(fmt.string(from:)) ?? "-"
            )
        }
        return try await req.view.render("repos/list", RepoListContext(username: user.username, repos: items))
    }

    @Sendable
    func createPage(req: Request) async throws -> View {
        _ = try await currentUser(req)
        let error = req.query[String.self, at: "error"]
        return try await req.view.render("repos/new", RepoCreatePageContext(error: error))
    }

    @Sendable
    func create(req: Request) async throws -> Response {
        let user = try await currentUser(req)
        let payload = try req.content.decode(CreateRepoForm.self)
        do {
            let created = try await createRepository(
                req: req,
                owner: user,
                name: payload.name,
                description: payload.description,
                visibility: payload.visibility == "public" ? .public : .private,
                initReadme: payload.initReadme != nil,
                initGitignore: payload.initGitignore != nil
            )
            return req.redirect(to: "/repos/\(created.owner.username)/\(created.repo.name)")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "create_failed"
            return req.redirect(to: "/repos/new?error=\(escaped)")
        }
    }

    @Sendable
    func detailPage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        let branches = try git.listBranches(owner: pair.owner, repo: pair.repo)
        let branch = branches.first ?? repo.defaultBranch
        let commits = try git.listCommits(owner: pair.owner, repo: pair.repo, branch: branch).map(toCommitResponse)
        let tree = try git.listTree(owner: pair.owner, repo: pair.repo, branch: branch, path: nil).map(toTreeResponse)
        let readme = try git.readme(owner: pair.owner, repo: pair.repo, branch: branch).map(markdown.renderHTML)

        let urls = cloneURLs(owner: pair.owner, repo: pair.repo)
        let context = RepoDetailContext(
            owner: pair.owner,
            repo: pair.repo,
            description: repo.description,
            visibility: repo.visibility.rawValue,
            defaultBranch: repo.defaultBranch,
            httpCloneURL: urls.http,
            sshCloneURL: urls.ssh,
            branches: branches,
            commits: commits,
            tree: tree,
            readmeHTML: readme
        )

        return try await req.view.render("repos/detail", context)
    }

    @Sendable
    func branchesPage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        let branchNames = try git.listBranches(owner: pair.owner, repo: pair.repo)
        let branches = try branchNames.map { branchName in
            let latest = try git.listCommits(owner: pair.owner, repo: pair.repo, branch: branchName, limit: 1).first
            return BranchItem(
                name: branchName,
                isDefault: branchName == repo.defaultBranch,
                latestMessage: latest?.message ?? "No commits yet",
                latestAuthor: latest?.author ?? "-",
                latestDate: latest?.date ?? "-"
            )
        }

        return try await req.view.render(
            "repos/branches",
            BranchesContext(
                owner: pair.owner,
                repo: pair.repo,
                defaultBranch: repo.defaultBranch,
                branches: branches
            )
        )
    }

    @Sendable
    func commitsPage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        let branch = req.query[String.self, at: "branch"] ?? repo.defaultBranch
        let commits = try git.listCommits(owner: pair.owner, repo: pair.repo, branch: branch).map(toCommitResponse)
        let context = CommitsContext(owner: pair.owner, repo: pair.repo, branch: branch, commits: commits)
        return try await req.view.render("repos/commits", context)
    }

    @Sendable
    func commitDetailPage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        guard let revision = req.parameters.get("revision"), !revision.isEmpty else {
            throw Abort(.badRequest, reason: "Missing commit revision")
        }

        let branch = req.query[String.self, at: "branch"] ?? repo.defaultBranch
        let detail = try git.showCommit(owner: pair.owner, repo: pair.repo, revision: revision)
        let context = CommitDetailContext(
            owner: pair.owner,
            repo: pair.repo,
            branch: branch,
            commit: toCommitResponse(detail.commit),
            files: detail.files.map(toCommitFileChangeResponse),
            diff: detail.diff
        )
        return try await req.view.render("repos/commit", context)
    }

    @Sendable
    func treePage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        let branch = req.parameters.get("branch") ?? repo.defaultBranch
        let path = req.parameters.get("**") ?? ""
        let tree = try git.listTree(owner: pair.owner, repo: pair.repo, branch: branch, path: path.isEmpty ? nil : path)
        let context = TreeContext(owner: pair.owner, repo: pair.repo, branch: branch, path: path, entries: tree.map(toTreeResponse))
        return try await req.view.render("repos/tree", context)
    }

    @Sendable
    func blobPage(req: Request) async throws -> View {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        let branch = req.parameters.get("branch") ?? repo.defaultBranch
        let path = req.parameters.get("**") ?? ""
        let file = try git.showFile(owner: pair.owner, repo: pair.repo, branch: branch, path: path)

        let context = BlobContext(
            owner: pair.owner,
            repo: pair.repo,
            branch: branch,
            path: path,
            isBinary: file.isBinary,
            content: file.isBinary ? nil : String(data: file.data, encoding: .utf8)
        )
        return try await req.view.render("repos/blob", context)
    }

    @Sendable
    func apiCreate(req: Request) async throws -> RepoResponse {
        let user = try await currentUser(req)
        let payload = try req.content.decode(CreateRepoRequest.self)
        let created = try await createRepository(
            req: req,
            owner: user,
            name: payload.name,
            description: payload.description,
            visibility: payload.visibility,
            initReadme: payload.initReadme ?? false,
            initGitignore: payload.initGitignore ?? false
        )
        return toRepoResponse(repo: created.repo, owner: created.owner.username)
    }

    @Sendable
    func apiList(req: Request) async throws -> [RepoResponse] {
        let user = try await currentUser(req)
        let repos = try await listRepositoriesFor(user: user, req: req)
        return repos.map { toRepoResponse(repo: $0, owner: $0.owner.username) }
    }

    @Sendable
    func apiDetail(req: Request) async throws -> RepoResponse {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)
        return toRepoResponse(repo: repo, owner: pair.owner)
    }

    @Sendable
    func apiBranches(req: Request) async throws -> [BranchResponse] {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)
        return try git.listBranches(owner: pair.owner, repo: pair.repo).map { BranchResponse(name: $0) }
    }

    @Sendable
    func apiCommits(req: Request) async throws -> [CommitResponse] {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)
        let branch = req.query[String.self, at: "branch"] ?? repo.defaultBranch
        return try git.listCommits(owner: pair.owner, repo: pair.repo, branch: branch).map(toCommitResponse)
    }

    @Sendable
    func apiCommitDetail(req: Request) async throws -> CommitDetailResponse {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)

        guard let revision = req.parameters.get("revision"), !revision.isEmpty else {
            throw Abort(.badRequest, reason: "Missing commit revision")
        }

        let detail = try git.showCommit(owner: pair.owner, repo: pair.repo, revision: revision)
        return CommitDetailResponse(
            commit: toCommitResponse(detail.commit),
            files: detail.files.map(toCommitFileChangeResponse),
            diff: detail.diff
        )
    }

    @Sendable
    func apiTree(req: Request) async throws -> [TreeEntryResponse] {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)
        let branch = req.parameters.get("branch") ?? repo.defaultBranch
        let path = req.parameters.get("**")
        return try git.listTree(owner: pair.owner, repo: pair.repo, branch: branch, path: path).map(toTreeResponse)
    }

    @Sendable
    func apiBlob(req: Request) async throws -> BlobResponse {
        let user = try await optionalCurrentUser(req)
        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try permission.requireRead(repo: repo, user: user)
        let branch = req.parameters.get("branch") ?? repo.defaultBranch
        let path = req.parameters.get("**") ?? ""
        let blob = try git.showFile(owner: pair.owner, repo: pair.repo, branch: branch, path: path)
        return BlobResponse(path: path, isBinary: blob.isBinary, content: blob.isBinary ? nil : String(data: blob.data, encoding: .utf8))
    }

    @Sendable
    func apiDelete(req: Request) async throws -> HTTPStatus {
        let user = try await currentUser(req)
        guard user.isAdmin else {
            throw Abort(.forbidden, reason: "Only admin can delete repositories")
        }

        let pair = try ownerRepo(req)
        let repo = try await findRepo(owner: pair.owner, repo: pair.repo, on: req)
        try await repo.delete(on: req.db)
        try FileManager.default.removeItem(atPath: repo.path)

        await audit.log(
            db: req.db,
            action: .deleteRepo,
            owner: pair.owner,
            repo: pair.repo,
            userID: user.id,
            clientIP: req.remoteAddress?.ipAddress
        )

        return .ok
    }

    private func createRepository(
        req: Request,
        owner: User,
        name: String,
        description: String?,
        visibility: RepositoryVisibility,
        initReadme: Bool,
        initGitignore: Bool
    ) async throws -> (repo: Repository, owner: User) {
        try InputValidator.validateNamespace(name, field: "repo")

        let ownerID = try owner.requireID()
        if try await Repository.query(on: req.db)
            .filter(\.$owner.$id == ownerID)
            .filter(\.$name == name)
            .first() != nil {
            throw Abort(.conflict, reason: "Repository already exists")
        }

        let repoPath = try git.initBareRepository(
            owner: owner.username,
            repo: name,
            initReadme: initReadme,
            initGitignore: initGitignore
        )

        let repo = Repository(
            name: name,
            ownerID: ownerID,
            visibility: visibility,
            description: description,
            defaultBranch: "master",
            path: repoPath
        )
        try await repo.save(on: req.db)

        await audit.log(
            db: req.db,
            action: .createRepo,
            owner: owner.username,
            repo: name,
            userID: ownerID,
            clientIP: req.remoteAddress?.ipAddress
        )

        return (repo, owner)
    }

    private func listRepositoriesFor(user: User, req: Request) async throws -> [Repository] {
        if user.isAdmin {
            return try await Repository.query(on: req.db).with(\.$owner).sort(\.$updatedAt, .descending).all()
        }
        let userID = try user.requireID()

        return try await Repository.query(on: req.db)
            .with(\.$owner)
            .group(.or) { group in
                group.filter(\.$visibilityRaw == RepositoryVisibility.public.rawValue)
                group.group(.and) { own in
                    own.filter(\.$owner.$id == userID)
                }
            }
            .sort(\.$updatedAt, .descending)
            .all()
    }

    private func currentUser(_ req: Request) async throws -> User {
        if let current = req.auth.get(User.self) {
            return current
        }
        if let bearerUser = try await authService.resolveBearerUser(req) {
            req.auth.login(bearerUser)
            return bearerUser
        }
        throw Abort(.unauthorized)
    }

    private func optionalCurrentUser(_ req: Request) async throws -> User? {
        if let current = req.auth.get(User.self) {
            return current
        }
        if let bearerUser = try await authService.resolveBearerUser(req) {
            return bearerUser
        }
        return nil
    }

    private func findRepo(owner: String, repo: String, on req: Request) async throws -> Repository {
        try InputValidator.validateNamespace(owner, field: "owner")
        try InputValidator.validateNamespace(repo, field: "repo")

        guard let model = try await Repository.query(on: req.db)
            .with(\.$owner)
            .join(User.self, on: \Repository.$owner.$id == \User.$id)
            .filter(User.self, \.$username == owner)
            .filter(\.$name == repo)
            .first() else {
            throw Abort(.notFound, reason: "Repository not found")
        }
        return model
    }

    private func ownerRepo(_ req: Request) throws -> (owner: String, repo: String) {
        guard let owner = req.parameters.get("owner"), let repo = req.parameters.get("repo") else {
            throw Abort(.badRequest, reason: "Missing owner/repo path")
        }
        return (owner, repo)
    }

    private func toCommitResponse(_ item: GitCommit) -> CommitResponse {
        CommitResponse(
            hash: item.hash,
            shortHash: item.shortHash,
            author: item.author,
            email: item.email,
            date: item.date,
            message: item.message
        )
    }

    private func toTreeResponse(_ item: GitTreeEntry) -> TreeEntryResponse {
        TreeEntryResponse(mode: item.mode, type: item.type, hash: item.hash, name: item.name)
    }

    private func toCommitFileChangeResponse(_ item: GitCommitFileChange) -> CommitFileChangeResponse {
        CommitFileChangeResponse(status: item.status, path: item.path)
    }

    private func toRepoResponse(repo: Repository, owner: String) -> RepoResponse {
        RepoResponse(
            id: (repo.id ?? UUID()),
            name: repo.name,
            owner: owner,
            visibility: repo.visibility.rawValue,
            description: repo.description,
            defaultBranch: repo.defaultBranch,
            path: repo.path,
            updatedAt: repo.updatedAt
        )
    }

    private func cloneURLs(owner: String, repo: String) -> (http: String, ssh: String) {
        let httpBase = Environment.get("PUBLIC_HTTP_BASE") ?? "http://127.0.0.1:2018"
        let sshBase = Environment.get("PUBLIC_SSH_BASE") ?? "git@127.0.0.1"
        return (
            "\(httpBase)/\(owner)/\(repo).git",
            "\(sshBase):\(owner)/\(repo).git"
        )
    }
}
