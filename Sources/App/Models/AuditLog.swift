import Fluent
import Vapor

enum AuditAction: String, Codable {
    case clone
    case fetch
    case push
    case createRepo = "create_repo"
    case deleteRepo = "delete_repo"
}

final class AuditLog: Model, Content, @unchecked Sendable {
    static let schema = "audit_logs"

    @ID(key: .id)
    var id: UUID?

    @OptionalParent(key: "user_id")
    var user: User?

    @Field(key: "action")
    var actionRaw: String

    @Field(key: "owner")
    var owner: String

    @Field(key: "repo")
    var repo: String

    @OptionalField(key: "client_ip")
    var clientIP: String?

    @OptionalField(key: "detail")
    var detail: String?

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    var action: AuditAction {
        get { AuditAction(rawValue: actionRaw) ?? .fetch }
        set { actionRaw = newValue.rawValue }
    }

    init() {}

    init(
        id: UUID? = nil,
        userID: UUID? = nil,
        action: AuditAction,
        owner: String,
        repo: String,
        clientIP: String?,
        detail: String?
    ) {
        self.id = id
        self.$user.id = userID
        self.actionRaw = action.rawValue
        self.owner = owner
        self.repo = repo
        self.clientIP = clientIP
        self.detail = detail
    }
}
