import Fluent

struct CreateRepository: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema(Repository.schema)
            .id()
            .field("name", .string, .required)
            .field("owner_id", .uuid, .required, .references(User.schema, .id, onDelete: .cascade))
            .field("visibility", .string, .required)
            .field("description", .string)
            .field("default_branch", .string, .required)
            .field("path", .string, .required)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .unique(on: "owner_id", "name")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema(Repository.schema).delete()
    }
}
