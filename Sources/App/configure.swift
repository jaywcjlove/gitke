import Fluent
import FluentPostgresDriver
import FluentSQLiteDriver
import Leaf
import Vapor

public func configure(_ app: Application) throws {
    app.http.server.configuration.hostname = Environment.get("HOST") ?? "0.0.0.0"
    app.http.server.configuration.port = Environment.get("PORT").flatMap(Int.init) ?? 2018

    if let databaseURL = Environment.get("DATABASE_URL"), databaseURL.hasPrefix("postgres://") {
        try app.databases.use(.postgres(url: databaseURL), as: .psql)
    } else {
        let sqlitePath = Environment.get("SQLITE_PATH") ?? "db.sqlite"
        app.databases.use(.sqlite(.file(sqlitePath)), as: .sqlite)
    }

    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))
    app.middleware.use(app.sessions.middleware)
    app.middleware.use(User.sessionAuthenticator())

    app.views.use(.leaf)

    app.migrations.add(CreateUser())
    app.migrations.add(CreateRepository())
    app.migrations.add(CreateSSHKey())
    app.migrations.add(CreateAccessToken())
    app.migrations.add(CreateAuditLog())

    try routes(app)
}
