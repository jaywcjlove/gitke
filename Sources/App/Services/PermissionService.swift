import Vapor

struct PermissionService {
    func canRead(repo: Repository, user: User?) -> Bool {
        if repo.isPublic { return true }
        guard let user else { return false }
        return user.isAdmin || user.id == repo.$owner.id
    }

    func canWrite(repo: Repository, user: User?) -> Bool {
        guard let user else { return false }
        return user.isAdmin || user.id == repo.$owner.id
    }

    func requireRead(repo: Repository, user: User?) throws {
        guard canRead(repo: repo, user: user) else {
            throw Abort(.unauthorized, reason: "Repository read not allowed")
        }
    }

    func requireWrite(repo: Repository, user: User?) throws {
        guard canWrite(repo: repo, user: user) else {
            throw Abort(.forbidden, reason: "Repository write not allowed")
        }
    }
}
