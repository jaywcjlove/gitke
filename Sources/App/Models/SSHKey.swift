import Fluent
import Vapor

final class SSHKey: Model, Content, @unchecked Sendable {
    static let schema = "ssh_keys"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "user_id")
    var user: User

    @Field(key: "title")
    var title: String

    @Field(key: "public_key")
    var publicKey: String

    @Field(key: "fingerprint")
    var fingerprint: String

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    init() {}

    init(id: UUID? = nil, userID: UUID, title: String, publicKey: String, fingerprint: String) {
        self.id = id
        self.$user.id = userID
        self.title = title
        self.publicKey = publicKey
        self.fingerprint = fingerprint
    }
}
