import Fluent
import Vapor

final class AccessToken: Model, Content, @unchecked Sendable {
    static let schema = "access_tokens"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "user_id")
    var user: User

    @Field(key: "name")
    var name: String

    @Field(key: "token_hash")
    var tokenHash: String

    @Field(key: "scopes")
    var scopes: String

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @OptionalField(key: "expired_at")
    var expiredAt: Date?

    init() {}

    init(id: UUID? = nil, userID: UUID, name: String, tokenHash: String, scopes: String, expiredAt: Date? = nil) {
        self.id = id
        self.$user.id = userID
        self.name = name
        self.tokenHash = tokenHash
        self.scopes = scopes
        self.expiredAt = expiredAt
    }
}
