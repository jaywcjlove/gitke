import Fluent

struct CreateSSHKey: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema(SSHKey.schema)
            .id()
            .field("user_id", .uuid, .required, .references(User.schema, .id, onDelete: .cascade))
            .field("title", .string, .required)
            .field("public_key", .string, .required)
            .field("fingerprint", .string, .required)
            .field("created_at", .datetime)
            .unique(on: "user_id", "fingerprint")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema(SSHKey.schema).delete()
    }
}
