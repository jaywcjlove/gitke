import Fluent
import Vapor

struct AuthController {
    private let authService = AuthService()

    struct LoginPageContext: Encodable {
        let error: String?
    }

    @Sendable
    func loginPage(req: Request) async throws -> View {
        try await req.view.render("auth/login", LoginPageContext(error: nil))
    }

    @Sendable
    func login(req: Request) async throws -> Response {
        struct LoginForm: Content {
            let username: String
            let password: String
        }

        let form = try req.content.decode(LoginForm.self)
        guard let user = try await User.query(on: req.db)
            .filter(\.$username == form.username)
            .first(),
              try user.verify(password: form.password) else {
            return req.redirect(to: "/login")
        }

        req.auth.login(user)
        req.session.authenticate(user)
        return req.redirect(to: "/repos")
    }

    @Sendable
    func logout(req: Request) async throws -> Response {
        req.auth.logout(User.self)
        req.session.unauthenticate(User.self)
        return req.redirect(to: "/login")
    }

    @Sendable
    func apiLogin(req: Request) async throws -> APIAuthLoginResponse {
        let payload = try req.content.decode(LoginRequest.self)
        guard let user = try await User.query(on: req.db)
            .filter(\.$username == payload.username)
            .first(),
              try user.verify(password: payload.password) else {
            throw Abort(.unauthorized, reason: "Invalid credentials")
        }

        req.auth.login(user)
        req.session.authenticate(user)

        let token = try await authService.createAccessToken(
            userID: try user.requireID(),
            name: "api-login",
            scopes: ["repo:read", "repo:write"],
            on: req.db
        )

        return APIAuthLoginResponse(
            user: UserResponse(id: try user.requireID(), username: user.username, isAdmin: user.isAdmin),
            token: token
        )
    }
}
