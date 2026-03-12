import Foundation
import Vapor

enum InputValidator {
    private static let nameRegex = try! NSRegularExpression(pattern: "^[A-Za-z0-9._-]+$")

    static func validateNamespace(_ name: String, field: String) throws {
        let range = NSRange(location: 0, length: name.utf16.count)
        guard !name.isEmpty,
              name.count <= 100,
              nameRegex.firstMatch(in: name, options: [], range: range) != nil,
              !name.contains("..") else {
            throw Abort(.badRequest, reason: "Invalid \(field)")
        }
    }

    static func validateRepoGitName(_ repoGit: String) throws -> String {
        guard repoGit.hasSuffix(".git") else {
            throw Abort(.badRequest, reason: "Repository path must end with .git")
        }
        let raw = String(repoGit.dropLast(4))
        try validateNamespace(raw, field: "repo")
        return raw
    }
}
