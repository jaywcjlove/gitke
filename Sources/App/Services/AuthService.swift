import Fluent
import Vapor

struct AuthService {
    func requireUser(_ req: Request) throws -> User {
        try req.auth.require(User.self)
    }

    func resolveBasicAuthUser(_ req: Request) async throws -> User? {
        guard let basic = req.headers.basicAuthorization else {
            return nil
        }
        guard let user = try await User.query(on: req.db)
            .filter(\.$username == basic.username)
            .first() else {
            return nil
        }
        if try user.verify(password: basic.password) {
            return user
        }
        return nil
    }

    func createAccessToken(userID: UUID, name: String, scopes: [String], on db: Database) async throws -> String {
        let plain = "gk_\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
        let token = AccessToken(
            userID: userID,
            name: name,
            tokenHash: try Bcrypt.hash(plain),
            scopes: scopes.joined(separator: ",")
        )
        try await token.save(on: db)
        return plain
    }

    func resolveBearerUser(_ req: Request) async throws -> User? {
        guard let bearer = req.headers.bearerAuthorization else { return nil }
        let candidates = try await AccessToken.query(on: req.db).with(\.$user).all()
        let now = Date()
        for token in candidates {
            if let expiredAt = token.expiredAt, expiredAt < now {
                continue
            }
            if try Bcrypt.verify(bearer.token, created: token.tokenHash) {
                return token.user
            }
        }
        return nil
    }
}
