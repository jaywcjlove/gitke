import Fluent

struct CreateAccessToken: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema(AccessToken.schema)
            .id()
            .field("user_id", .uuid, .required, .references(User.schema, .id, onDelete: .cascade))
            .field("name", .string, .required)
            .field("token_hash", .string, .required)
            .field("scopes", .string, .required)
            .field("created_at", .datetime)
            .field("expired_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema(AccessToken.schema).delete()
    }
}
