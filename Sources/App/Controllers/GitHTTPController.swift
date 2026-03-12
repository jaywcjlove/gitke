import Fluent
import Vapor

struct GitHTTPController {
    private let git = GitService()
    private let auth = AuthService()
    private let permission = PermissionService()
    private let audit = AuditService()

    @Sendable
    func infoRefs(req: Request) async throws -> Response {
        let service = req.query[String.self, at: "service"] ?? ""
        return try await handle(req: req, op: .infoRefs(service: service))
    }

    @Sendable
    func uploadPack(req: Request) async throws -> Response {
        try await handle(req: req, op: .uploadPack)
    }

    @Sendable
    func receivePack(req: Request) async throws -> Response {
        try await handle(req: req, op: .receivePack)
    }

    private enum Operation {
        case infoRefs(service: String)
        case uploadPack
        case receivePack

        var isWrite: Bool {
            switch self {
            case .receivePack: return true
            case let .infoRefs(service): return service == "git-receive-pack"
            case .uploadPack: return false
            }
        }

        var auditAction: AuditAction {
            switch self {
            case let .infoRefs(service):
                return service == "git-receive-pack" ? .push : .clone
            case .uploadPack:
                return .fetch
            case .receivePack:
                return .push
            }
        }
    }

    private func handle(req: Request, op: Operation) async throws -> Response {
        guard let owner = req.parameters.get("owner"), let repoGit = req.parameters.get("repoGit") else {
            throw Abort(.badRequest, reason: "Invalid path")
        }
        let repo = try InputValidator.validateRepoGitName(repoGit)

        let repository = try await findRepo(owner: owner, repo: repo, on: req)

        let basicUser = try await auth.resolveBasicAuthUser(req)
        if repository.isPublic && !op.isWrite {
            // allow anonymous read
        } else if op.isWrite {
            try permission.requireWrite(repo: repository, user: basicUser)
        } else {
            try permission.requireRead(repo: repository, user: basicUser)
        }

        let result = try git.handleSmartHTTP(req: req, owner: owner, repoGit: repoGit, remoteUser: basicUser?.username)

        await audit.log(
            db: req.db,
            action: op.auditAction,
            owner: owner,
            repo: repo,
            userID: basicUser?.id,
            clientIP: req.remoteAddress?.ipAddress,
            detail: req.url.path
        )

        return Response(status: result.status, headers: result.headers, body: .init(buffer: result.body))
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
            throw Abort(.notFound)
        }
        return model
    }
}
