import Fluent
import Vapor

struct UserController {
    struct UserListItem: Encodable {
        let id: String
        let username: String
        let isAdmin: Bool
        let createdAt: String
    }

    struct AdminUsersPageContext: Encodable {
        let users: [UserListItem]
        let error: String?
        let success: String?
    }

    struct CreateUserForm: Content {
        let username: String
        let password: String
        let isAdmin: String?
    }

    struct UpdateUserForm: Content {
        let username: String
        let password: String?
        let isAdmin: String?
    }

    struct CreateUserRequest: Content {
        let username: String
        let password: String
        let isAdmin: Bool?
    }

    struct UpdateUserRequest: Content {
        let username: String?
        let password: String?
        let isAdmin: Bool?
    }

    @Sendable
    func bootstrapAdmin(req: Request) async throws -> HTTPStatus {
        struct Payload: Content {
            let username: String
            let password: String
        }

        let payload = try req.content.decode(Payload.self)
        try InputValidator.validateNamespace(payload.username, field: "username")

        let count = try await User.query(on: req.db).count()
        if count > 0 {
            let current = req.auth.get(User.self)
            guard current?.isAdmin == true else {
                throw Abort(.forbidden, reason: "Only admin can create another admin")
            }
        }

        guard try await User.query(on: req.db).filter(\.$username == payload.username).first() == nil else {
            throw Abort(.conflict, reason: "Username already exists")
        }

        let user = User(
            username: payload.username,
            passwordHash: try Bcrypt.hash(payload.password),
            isAdmin: true
        )
        try await user.save(on: req.db)
        return .created
    }

    @Sendable
    func usersPage(req: Request) async throws -> View {
        _ = try await requireAdmin(req)
        let users = try await loadUsers(req)
        let error = req.query[String.self, at: "error"]
        let ok = req.query[String.self, at: "ok"]
        let success: String?
        switch ok {
        case "created": success = "用户已创建"
        case "updated": success = "用户已更新"
        case "deleted": success = "用户已删除"
        default: success = nil
        }
        return try await req.view.render("admin/users", AdminUsersPageContext(users: users, error: error, success: success))
    }

    @Sendable
    func createUser(req: Request) async throws -> Response {
        _ = try await requireAdmin(req)
        let payload = try req.content.decode(CreateUserForm.self)

        do {
            _ = try await createUserModel(
                username: payload.username,
                password: payload.password,
                isAdmin: payload.isAdmin != nil,
                on: req.db
            )
            return req.redirect(to: "/admin/users?ok=created")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "create_user_failed"
            return req.redirect(to: "/admin/users?error=\(escaped)")
        }
    }

    @Sendable
    func updateUser(req: Request) async throws -> Response {
        do {
            let admin = try await requireAdmin(req)
            let payload = try req.content.decode(UpdateUserForm.self)
            guard let idText = req.parameters.get("id"), let userID = UUID(uuidString: idText) else {
                throw Abort(.badRequest, reason: "Invalid user id")
            }

            guard let user = try await User.find(userID, on: req.db) else {
                throw Abort(.notFound, reason: "User not found")
            }

            try InputValidator.validateNamespace(payload.username, field: "username")
            let newIsAdmin = payload.isAdmin != nil

            if user.id == admin.id, !newIsAdmin {
                throw Abort(.badRequest, reason: "Cannot remove admin role from current user")
            }

            user.username = payload.username
            user.isAdmin = newIsAdmin
            if let password = payload.password, !password.isEmpty {
                user.passwordHash = try Bcrypt.hash(password)
            }

            try await user.save(on: req.db)
            return req.redirect(to: "/admin/users?ok=updated")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "update_user_failed"
            return req.redirect(to: "/admin/users?error=\(escaped)")
        }
    }

    @Sendable
    func deleteUser(req: Request) async throws -> Response {
        do {
            let admin = try await requireAdmin(req)
            guard let idText = req.parameters.get("id"), let userID = UUID(uuidString: idText) else {
                throw Abort(.badRequest, reason: "Invalid user id")
            }

            guard let user = try await User.find(userID, on: req.db) else {
                throw Abort(.notFound, reason: "User not found")
            }

            if user.id == admin.id {
                throw Abort(.badRequest, reason: "Cannot delete current user")
            }

            try await user.delete(on: req.db)
            return req.redirect(to: "/admin/users?ok=deleted")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "delete_user_failed"
            return req.redirect(to: "/admin/users?error=\(escaped)")
        }
    }

    @Sendable
    func apiListUsers(req: Request) async throws -> [UserResponse] {
        _ = try await requireAdmin(req)
        return try await User.query(on: req.db).sort(\.$createdAt, .descending).all().map {
            UserResponse(id: try $0.requireID(), username: $0.username, isAdmin: $0.isAdmin)
        }
    }

    @Sendable
    func apiCreateUser(req: Request) async throws -> UserResponse {
        _ = try await requireAdmin(req)
        let payload = try req.content.decode(CreateUserRequest.self)
        let user = try await createUserModel(
            username: payload.username,
            password: payload.password,
            isAdmin: payload.isAdmin ?? false,
            on: req.db
        )
        return UserResponse(id: try user.requireID(), username: user.username, isAdmin: user.isAdmin)
    }

    @Sendable
    func apiUpdateUser(req: Request) async throws -> UserResponse {
        let admin = try await requireAdmin(req)
        let payload = try req.content.decode(UpdateUserRequest.self)

        guard let idText = req.parameters.get("id"), let userID = UUID(uuidString: idText) else {
            throw Abort(.badRequest, reason: "Invalid user id")
        }
        guard let user = try await User.find(userID, on: req.db) else {
            throw Abort(.notFound, reason: "User not found")
        }

        if let username = payload.username {
            try InputValidator.validateNamespace(username, field: "username")
            user.username = username
        }

        if let isAdmin = payload.isAdmin {
            if user.id == admin.id, !isAdmin {
                throw Abort(.badRequest, reason: "Cannot remove admin role from current user")
            }
            user.isAdmin = isAdmin
        }

        if let password = payload.password, !password.isEmpty {
            user.passwordHash = try Bcrypt.hash(password)
        }

        try await user.save(on: req.db)
        return UserResponse(id: try user.requireID(), username: user.username, isAdmin: user.isAdmin)
    }

    @Sendable
    func apiDeleteUser(req: Request) async throws -> HTTPStatus {
        let admin = try await requireAdmin(req)

        guard let idText = req.parameters.get("id"), let userID = UUID(uuidString: idText) else {
            throw Abort(.badRequest, reason: "Invalid user id")
        }
        guard let user = try await User.find(userID, on: req.db) else {
            throw Abort(.notFound, reason: "User not found")
        }

        if user.id == admin.id {
            throw Abort(.badRequest, reason: "Cannot delete current user")
        }

        try await user.delete(on: req.db)
        return .ok
    }

    private func requireAdmin(_ req: Request) async throws -> User {
        if let user = req.auth.get(User.self), user.isAdmin {
            return user
        }

        let authService = AuthService()
        if let bearer = try await authService.resolveBearerUser(req), bearer.isAdmin {
            return bearer
        }

        throw Abort(.forbidden, reason: "Admin only")
    }

    private func loadUsers(_ req: Request) async throws -> [UserListItem] {
        let fmt = ISO8601DateFormatter()
        return try await User.query(on: req.db)
            .sort(\.$createdAt, .descending)
            .all()
            .map {
                UserListItem(
                    id: (try? $0.requireID().uuidString) ?? "",
                    username: $0.username,
                    isAdmin: $0.isAdmin,
                    createdAt: $0.createdAt.map(fmt.string(from:)) ?? "-"
                )
            }
    }

    private func createUserModel(username: String, password: String, isAdmin: Bool, on db: Database) async throws -> User {
        try InputValidator.validateNamespace(username, field: "username")
        guard !password.isEmpty else {
            throw Abort(.badRequest, reason: "Password cannot be empty")
        }

        guard try await User.query(on: db).filter(\.$username == username).first() == nil else {
            throw Abort(.conflict, reason: "Username already exists")
        }

        let user = User(username: username, passwordHash: try Bcrypt.hash(password), isAdmin: isAdmin)
        try await user.save(on: db)
        return user
    }
}
