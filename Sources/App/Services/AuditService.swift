import Fluent
import Vapor

struct AuditService {
    func log(
        db: Database,
        action: AuditAction,
        owner: String,
        repo: String,
        userID: UUID?,
        clientIP: String?,
        detail: String? = nil
    ) async {
        let item = AuditLog(
            userID: userID,
            action: action,
            owner: owner,
            repo: repo,
            clientIP: clientIP,
            detail: detail
        )
        do {
            try await item.save(on: db)
        } catch {
            db.logger.error("audit log failed: \(error.localizedDescription)")
        }
    }
}
