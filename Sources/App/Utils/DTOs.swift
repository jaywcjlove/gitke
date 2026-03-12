import Vapor

struct LoginRequest: Content {
    let username: String
    let password: String
}

struct APIAuthLoginResponse: Content {
    let user: UserResponse
    let token: String
}

struct CreateRepoRequest: Content {
    let name: String
    let description: String?
    let visibility: RepositoryVisibility
    let initReadme: Bool?
    let initGitignore: Bool?
}

struct UserResponse: Content {
    let id: UUID
    let username: String
    let isAdmin: Bool
}

struct RepoResponse: Content {
    let id: UUID
    let name: String
    let owner: String
    let visibility: String
    let description: String?
    let defaultBranch: String
    let path: String
    let updatedAt: Date?
}

struct BranchResponse: Content {
    let name: String
}

struct CommitResponse: Content {
    let hash: String
    let shortHash: String
    let author: String
    let email: String
    let date: String
    let message: String
}

struct CommitFileChangeResponse: Content {
    let status: String
    let path: String
}

struct CommitDetailResponse: Content {
    let commit: CommitResponse
    let files: [CommitFileChangeResponse]
    let diff: String
}

struct TreeEntryResponse: Content {
    let mode: String
    let type: String
    let hash: String
    let name: String
}

struct BlobResponse: Content {
    let path: String
    let isBinary: Bool
    let content: String?
}
