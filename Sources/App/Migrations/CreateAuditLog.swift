import Fluent

struct CreateAuditLog: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema(AuditLog.schema)
            .id()
            .field("user_id", .uuid, .references(User.schema, .id, onDelete: .setNull))
            .field("action", .string, .required)
            .field("owner", .string, .required)
            .field("repo", .string, .required)
            .field("client_ip", .string)
            .field("detail", .string)
            .field("created_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema(AuditLog.schema).delete()
    }
}
