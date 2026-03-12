import Fluent
import Vapor

enum RepositoryVisibility: String, Codable {
    case `public`
    case `private`
}

final class Repository: Model, Content, @unchecked Sendable {
    static let schema = "repositories"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @Parent(key: "owner_id")
    var owner: User

    @Field(key: "visibility")
    var visibilityRaw: String

    @OptionalField(key: "description")
    var description: String?

    @Field(key: "default_branch")
    var defaultBranch: String

    @Field(key: "path")
    var path: String

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?

    var visibility: RepositoryVisibility {
        get { RepositoryVisibility(rawValue: visibilityRaw) ?? .private }
        set { visibilityRaw = newValue.rawValue }
    }

    init() {}

    init(
        id: UUID? = nil,
        name: String,
        ownerID: User.IDValue,
        visibility: RepositoryVisibility,
        description: String?,
        defaultBranch: String = "master",
        path: String
    ) {
        self.id = id
        self.name = name
        self.$owner.id = ownerID
        self.visibilityRaw = visibility.rawValue
        self.description = description
        self.defaultBranch = defaultBranch
        self.path = path
    }

    var isPublic: Bool { visibility == .public }
}
