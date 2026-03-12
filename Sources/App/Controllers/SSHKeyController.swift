import Fluent
import Foundation
import Vapor

struct SSHKeyController {
    struct SSHKeyItem: Encodable {
        let id: String
        let title: String
        let fingerprint: String
        let publicKey: String
        let createdAt: String
    }

    struct SSHKeysPageContext: Encodable {
        let keys: [SSHKeyItem]
        let error: String?
        let success: String?
    }

    struct CreateSSHKeyForm: Content {
        let title: String
        let publicKey: String
    }

    struct UpdateSSHKeyForm: Content {
        let title: String
        let publicKey: String
    }

    struct CreateSSHKeyRequest: Content {
        let title: String
        let publicKey: String
    }

    struct UpdateSSHKeyRequest: Content {
        let title: String?
        let publicKey: String?
    }

    struct SSHKeyResponse: Content {
        let id: UUID
        let title: String
        let fingerprint: String
        let publicKey: String
        let createdAt: Date?
    }

    @Sendable
    func listPage(req: Request) async throws -> View {
        let user = try await requireUser(req)
        let keys = try await loadKeys(userID: try user.requireID(), on: req.db)

        let ok = req.query[String.self, at: "ok"]
        let success: String?
        switch ok {
        case "created": success = "SSH Key 已创建"
        case "updated": success = "SSH Key 已更新"
        case "deleted": success = "SSH Key 已删除"
        default: success = nil
        }

        return try await req.view.render("settings/ssh_keys", SSHKeysPageContext(
            keys: keys,
            error: req.query[String.self, at: "error"],
            success: success
        ))
    }

    @Sendable
    func create(req: Request) async throws -> Response {
        do {
            let user = try await requireUser(req)
            let payload = try req.content.decode(CreateSSHKeyForm.self)
            _ = try await createSSHKey(userID: try user.requireID(), title: payload.title, publicKey: payload.publicKey, on: req.db)
            return req.redirect(to: "/settings/ssh-keys?ok=created")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "ssh_key_create_failed"
            return req.redirect(to: "/settings/ssh-keys?error=\(escaped)")
        }
    }

    @Sendable
    func update(req: Request) async throws -> Response {
        do {
            let user = try await requireUser(req)
            let userID = try user.requireID()
            let payload = try req.content.decode(UpdateSSHKeyForm.self)
            guard let idText = req.parameters.get("id"), let keyID = UUID(uuidString: idText) else {
                throw Abort(.badRequest, reason: "Invalid key id")
            }

            guard let key = try await SSHKey.find(keyID, on: req.db), key.$user.id == user.id else {
                throw Abort(.notFound, reason: "SSH key not found")
            }

            try validateTitle(payload.title)
            let normalizedKey = normalizePublicKey(payload.publicKey)
            let fingerprint = try fingerprint(of: normalizedKey)

            let duplicate = try await SSHKey.query(on: req.db)
                .filter(\.$user.$id == userID)
                .filter(\.$fingerprint == fingerprint)
                .first()

            if let duplicate, duplicate.id != key.id {
                throw Abort(.conflict, reason: "SSH key already exists")
            }

            key.title = payload.title
            key.publicKey = normalizedKey
            key.fingerprint = fingerprint
            try await key.save(on: req.db)

            return req.redirect(to: "/settings/ssh-keys?ok=updated")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "ssh_key_update_failed"
            return req.redirect(to: "/settings/ssh-keys?error=\(escaped)")
        }
    }

    @Sendable
    func delete(req: Request) async throws -> Response {
        do {
            let user = try await requireUser(req)
            guard let idText = req.parameters.get("id"), let keyID = UUID(uuidString: idText) else {
                throw Abort(.badRequest, reason: "Invalid key id")
            }

            guard let key = try await SSHKey.find(keyID, on: req.db), key.$user.id == user.id else {
                throw Abort(.notFound, reason: "SSH key not found")
            }

            try await key.delete(on: req.db)
            return req.redirect(to: "/settings/ssh-keys?ok=deleted")
        } catch {
            let reason = (error as? AbortError)?.reason ?? error.localizedDescription
            let escaped = reason.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "ssh_key_delete_failed"
            return req.redirect(to: "/settings/ssh-keys?error=\(escaped)")
        }
    }

    @Sendable
    func apiList(req: Request) async throws -> [SSHKeyResponse] {
        let user = try await requireUser(req)
        let userID = try user.requireID()
        return try await SSHKey.query(on: req.db)
            .filter(\.$user.$id == userID)
            .sort(\.$createdAt, .descending)
            .all()
            .map { item in
                SSHKeyResponse(
                    id: try item.requireID(),
                    title: item.title,
                    fingerprint: item.fingerprint,
                    publicKey: item.publicKey,
                    createdAt: item.createdAt
                )
            }
    }

    @Sendable
    func apiCreate(req: Request) async throws -> SSHKeyResponse {
        let user = try await requireUser(req)
        let payload = try req.content.decode(CreateSSHKeyRequest.self)
        let item = try await createSSHKey(userID: try user.requireID(), title: payload.title, publicKey: payload.publicKey, on: req.db)

        return SSHKeyResponse(
            id: try item.requireID(),
            title: item.title,
            fingerprint: item.fingerprint,
            publicKey: item.publicKey,
            createdAt: item.createdAt
        )
    }

    @Sendable
    func apiUpdate(req: Request) async throws -> SSHKeyResponse {
        let user = try await requireUser(req)
        let userID = try user.requireID()
        let payload = try req.content.decode(UpdateSSHKeyRequest.self)

        guard let idText = req.parameters.get("id"), let keyID = UUID(uuidString: idText) else {
            throw Abort(.badRequest, reason: "Invalid key id")
        }
        guard let item = try await SSHKey.find(keyID, on: req.db), item.$user.id == user.id else {
            throw Abort(.notFound, reason: "SSH key not found")
        }

        if let title = payload.title {
            try validateTitle(title)
            item.title = title
        }

        if let publicKey = payload.publicKey {
            let normalized = normalizePublicKey(publicKey)
            let fp = try fingerprint(of: normalized)

            let duplicate = try await SSHKey.query(on: req.db)
                .filter(\.$user.$id == userID)
                .filter(\.$fingerprint == fp)
                .first()
            if let duplicate, duplicate.id != item.id {
                throw Abort(.conflict, reason: "SSH key already exists")
            }

            item.publicKey = normalized
            item.fingerprint = fp
        }

        try await item.save(on: req.db)
        return SSHKeyResponse(
            id: try item.requireID(),
            title: item.title,
            fingerprint: item.fingerprint,
            publicKey: item.publicKey,
            createdAt: item.createdAt
        )
    }

    @Sendable
    func apiDelete(req: Request) async throws -> HTTPStatus {
        let user = try await requireUser(req)
        guard let idText = req.parameters.get("id"), let keyID = UUID(uuidString: idText) else {
            throw Abort(.badRequest, reason: "Invalid key id")
        }
        guard let item = try await SSHKey.find(keyID, on: req.db), item.$user.id == user.id else {
            throw Abort(.notFound, reason: "SSH key not found")
        }

        try await item.delete(on: req.db)
        return .ok
    }

    private func createSSHKey(userID: UUID, title: String, publicKey: String, on db: Database) async throws -> SSHKey {
        try validateTitle(title)
        let normalizedKey = normalizePublicKey(publicKey)
        let fp = try fingerprint(of: normalizedKey)

        let exists = try await SSHKey.query(on: db)
            .filter(\.$user.$id == userID)
            .filter(\.$fingerprint == fp)
            .first() != nil

        if exists {
            throw Abort(.conflict, reason: "SSH key already exists")
        }

        let item = SSHKey(userID: userID, title: title, publicKey: normalizedKey, fingerprint: fp)
        try await item.save(on: db)
        return item
    }

    private func loadKeys(userID: UUID, on db: Database) async throws -> [SSHKeyItem] {
        let fmt = ISO8601DateFormatter()
        return try await SSHKey.query(on: db)
            .filter(\.$user.$id == userID)
            .sort(\.$createdAt, .descending)
            .all()
            .map {
                SSHKeyItem(
                    id: (try? $0.requireID().uuidString) ?? "",
                    title: $0.title,
                    fingerprint: $0.fingerprint,
                    publicKey: $0.publicKey,
                    createdAt: $0.createdAt.map(fmt.string(from:)) ?? "-"
                )
            }
    }

    private func requireUser(_ req: Request) async throws -> User {
        if let current = req.auth.get(User.self) {
            return current
        }
        let authService = AuthService()
        if let bearer = try await authService.resolveBearerUser(req) {
            req.auth.login(bearer)
            return bearer
        }
        throw Abort(.unauthorized)
    }

    private func validateTitle(_ title: String) throws {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= 120 else {
            throw Abort(.badRequest, reason: "Invalid SSH key title")
        }
    }

    private func normalizePublicKey(_ key: String) -> String {
        key.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func fingerprint(of publicKey: String) throws -> String {
        guard publicKey.hasPrefix("ssh-") else {
            throw Abort(.badRequest, reason: "Invalid SSH public key")
        }

        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("gitke-sshkey-\(UUID().uuidString).pub")
        defer { try? FileManager.default.removeItem(at: tempURL) }

        try publicKey.appending("\n").write(to: tempURL, atomically: true, encoding: .utf8)
        let output = try ProcessRunner.run(
            executable: "/usr/bin/env",
            arguments: ["ssh-keygen", "-lf", tempURL.path]
        )

        guard output.status == 0 else {
            let err = String(decoding: output.stderr, as: UTF8.self)
            throw Abort(.badRequest, reason: "Invalid SSH public key: \(err)")
        }

        let text = String(decoding: output.stdout, as: UTF8.self)
        let parts = text.split(whereSeparator: { $0.isWhitespace })
        guard parts.count >= 2 else {
            throw Abort(.badRequest, reason: "Failed to parse SSH key fingerprint")
        }
        return String(parts[1])
    }
}
