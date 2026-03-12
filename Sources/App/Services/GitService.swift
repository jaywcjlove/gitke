import Fluent
import Foundation
import Vapor

struct GitCommit {
    let hash: String
    let shortHash: String
    let author: String
    let email: String
    let date: String
    let message: String
}

struct GitCommitFileChange {
    let status: String
    let path: String
}

struct GitCommitDetail {
    let commit: GitCommit
    let files: [GitCommitFileChange]
    let diff: String
}

struct GitTreeEntry {
    let mode: String
    let type: String
    let hash: String
    let name: String
}

struct GitBlob {
    let path: String
    let data: Data
    let isBinary: Bool
}

struct SmartHTTPResult {
    let status: HTTPStatus
    let headers: HTTPHeaders
    let body: ByteBuffer
}

struct GitService {
    let repoRoot: String

    init(repoRoot: String = Environment.get("REPO_ROOT") ?? "\(FileManager.default.currentDirectoryPath)/data/git/repositories") {
        self.repoRoot = repoRoot
    }

    func resolveRepoPath(owner: String, repo: String) throws -> String {
        try InputValidator.validateNamespace(owner, field: "owner")
        try InputValidator.validateNamespace(repo, field: "repo")

        let rootURL = URL(fileURLWithPath: repoRoot, isDirectory: true).standardizedFileURL
        let repoURL = rootURL
            .appendingPathComponent(owner, isDirectory: true)
            .appendingPathComponent("\(repo).git", isDirectory: true)
            .standardizedFileURL

        guard repoURL.path.hasPrefix(rootURL.path) else {
            throw Abort(.badRequest, reason: "Invalid repository path")
        }
        return repoURL.path
    }

    func repositoryExists(owner: String, repo: String) throws -> Bool {
        let path = try resolveRepoPath(owner: owner, repo: repo)
        var isDir: ObjCBool = false
        return FileManager.default.fileExists(atPath: path, isDirectory: &isDir) && isDir.boolValue
    }

    func initBareRepository(
        owner: String,
        repo: String,
        initReadme: Bool,
        initGitignore: Bool
    ) throws -> String {
        let path = try resolveRepoPath(owner: owner, repo: repo)
        let ownerDir = URL(fileURLWithPath: path).deletingLastPathComponent()
        try FileManager.default.createDirectory(at: ownerDir, withIntermediateDirectories: true, attributes: nil)

        guard !(try repositoryExists(owner: owner, repo: repo)) else {
            throw Abort(.conflict, reason: "Repository already exists")
        }

        let initResult = try ProcessRunner.runGit(args: ["init", "--bare", path])
        guard initResult.status == 0 else {
            throw Abort(.internalServerError, reason: String(decoding: initResult.stderr, as: UTF8.self))
        }

        if initReadme || initGitignore {
            try seedInitialCommit(path: path, initReadme: initReadme, initGitignore: initGitignore)
        }

        return path
    }

    private func seedInitialCommit(path: String, initReadme: Bool, initGitignore: Bool) throws {
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("gitke-init-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tmp, withIntermediateDirectories: true, attributes: nil)
        defer { try? FileManager.default.removeItem(at: tmp) }

        _ = try ProcessRunner.runGit(args: ["-C", tmp.path, "init", "."])

        if initReadme {
            try "# New Repository\n".write(to: tmp.appendingPathComponent("README.md"), atomically: true, encoding: .utf8)
        }
        if initGitignore {
            try "*.swp\n.DS_Store\n.build/\n".write(to: tmp.appendingPathComponent(".gitignore"), atomically: true, encoding: .utf8)
        }

        let status = try ProcessRunner.runGit(args: ["-C", tmp.path, "status", "--porcelain"])
        if !status.stdout.isEmpty {
            _ = try ProcessRunner.runGit(args: ["-C", tmp.path, "add", "."])
            _ = try ProcessRunner.runGit(args: [
                "-C", tmp.path,
                "-c", "user.name=Gitke",
                "-c", "user.email=gitke@localhost",
                "commit", "-m", "Initial commit"
            ])
            _ = try ProcessRunner.runGit(args: ["-C", tmp.path, "branch", "-M", "master"])
            _ = try ProcessRunner.runGit(args: ["-C", tmp.path, "remote", "add", "origin", path])
            let pushResult = try ProcessRunner.runGit(args: ["-C", tmp.path, "push", "origin", "master"])
            guard pushResult.status == 0 else {
                throw Abort(.internalServerError, reason: String(decoding: pushResult.stderr, as: UTF8.self))
            }
        }
    }

    func listBranches(owner: String, repo: String) throws -> [String] {
        let repoPath = try resolveRepoPath(owner: owner, repo: repo)
        let output = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "for-each-ref", "refs/heads",
            "--format=%(refname:short)"
        ])
        guard output.status == 0 else {
            throw Abort(.internalServerError, reason: String(decoding: output.stderr, as: UTF8.self))
        }
        return String(decoding: output.stdout, as: UTF8.self)
            .split(separator: "\n")
            .map(String.init)
            .filter { !$0.isEmpty }
    }

    func listCommits(owner: String, repo: String, branch: String, limit: Int = 50) throws -> [GitCommit] {
        let repoPath = try resolveRepoPath(owner: owner, repo: repo)
        let output = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "log", branch,
            "--pretty=format:%H%x09%h%x09%an%x09%ae%x09%ad%x09%s",
            "--date=iso-strict",
            "-n", String(limit)
        ])

        if output.status != 0 {
            let stderr = String(decoding: output.stderr, as: UTF8.self)
            if stderr.contains("does not have any commits yet") || stderr.contains("unknown revision") {
                return []
            }
            throw Abort(.internalServerError, reason: stderr)
        }

        return String(decoding: output.stdout, as: UTF8.self)
            .split(separator: "\n")
            .compactMap { line in
                let parts = line.split(separator: "\t", maxSplits: 5, omittingEmptySubsequences: false)
                guard parts.count == 6 else { return nil }
                return GitCommit(
                    hash: String(parts[0]),
                    shortHash: String(parts[1]),
                    author: String(parts[2]),
                    email: String(parts[3]),
                    date: String(parts[4]),
                    message: String(parts[5])
                )
            }
    }

    func showCommit(owner: String, repo: String, revision: String) throws -> GitCommitDetail {
        try InputValidator.validateNamespace(revision.replacingOccurrences(of: "/", with: ""), field: "revision")
        let repoPath = try resolveRepoPath(owner: owner, repo: repo)

        let metaOutput = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "show", revision,
            "--quiet",
            "--pretty=format:%H%x09%h%x09%an%x09%ae%x09%ad%x09%s",
            "--date=iso-strict"
        ])
        guard metaOutput.status == 0 else {
            throw Abort(.notFound, reason: "Commit not found")
        }

        let metaText = String(decoding: metaOutput.stdout, as: UTF8.self)
        let parts = metaText.split(separator: "\t", maxSplits: 5, omittingEmptySubsequences: false)
        guard parts.count == 6 else {
            throw Abort(.internalServerError, reason: "Failed to parse commit metadata")
        }

        let commit = GitCommit(
            hash: String(parts[0]),
            shortHash: String(parts[1]),
            author: String(parts[2]),
            email: String(parts[3]),
            date: String(parts[4]),
            message: String(parts[5])
        )

        let filesOutput = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "show", revision,
            "--format=",
            "--name-status"
        ])
        guard filesOutput.status == 0 else {
            throw Abort(.internalServerError, reason: String(decoding: filesOutput.stderr, as: UTF8.self))
        }

        let files = String(decoding: filesOutput.stdout, as: UTF8.self)
            .split(separator: "\n")
            .compactMap { line -> GitCommitFileChange? in
                let cols = line.split(separator: "\t", maxSplits: 1, omittingEmptySubsequences: false)
                guard cols.count == 2 else { return nil }
                return GitCommitFileChange(status: String(cols[0]), path: String(cols[1]))
            }

        let diffOutput = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "show", revision,
            "--format=",
            "--patch",
            "--find-renames"
        ])
        guard diffOutput.status == 0 else {
            throw Abort(.internalServerError, reason: String(decoding: diffOutput.stderr, as: UTF8.self))
        }

        let diff = String(decoding: diffOutput.stdout, as: UTF8.self)
        return GitCommitDetail(commit: commit, files: files, diff: diff)
    }

    func listTree(owner: String, repo: String, branch: String, path: String?) throws -> [GitTreeEntry] {
        let repoPath = try resolveRepoPath(owner: owner, repo: repo)
        let target = if let path, !path.isEmpty { "\(branch):\(path)" } else { branch }

        let output = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "ls-tree", target
        ])

        guard output.status == 0 else {
            let stderr = String(decoding: output.stderr, as: UTF8.self)
            if stderr.contains("Not a valid object name") || stderr.contains("does not have any commits yet") {
                return []
            }
            throw Abort(.internalServerError, reason: stderr)
        }

        return String(decoding: output.stdout, as: UTF8.self)
            .split(separator: "\n")
            .compactMap { line in
                let pair = line.split(separator: "\t", maxSplits: 1, omittingEmptySubsequences: false)
                guard pair.count == 2 else { return nil }
                let head = pair[0].split(separator: " ")
                guard head.count == 3 else { return nil }
                return GitTreeEntry(
                    mode: String(head[0]),
                    type: String(head[1]),
                    hash: String(head[2]),
                    name: String(pair[1])
                )
            }
    }

    func showFile(owner: String, repo: String, branch: String, path: String) throws -> GitBlob {
        let repoPath = try resolveRepoPath(owner: owner, repo: repo)
        let output = try ProcessRunner.runGit(args: [
            "--git-dir", repoPath,
            "show", "\(branch):\(path)"
        ])

        guard output.status == 0 else {
            throw Abort(.notFound, reason: "File not found")
        }

        let data = output.stdout
        let isBinary = data.contains(0)
        return GitBlob(path: path, data: data, isBinary: isBinary)
    }

    func readme(owner: String, repo: String, branch: String) throws -> String? {
        let candidates = ["README.md", "README.MD", "README"]
        for file in candidates {
            if let blob = try? showFile(owner: owner, repo: repo, branch: branch, path: file), !blob.isBinary {
                return String(data: blob.data, encoding: .utf8)
            }
        }
        return nil
    }

    func handleSmartHTTP(req: Request, owner: String, repoGit: String, remoteUser: String?) throws -> SmartHTTPResult {
        let bodyData = req.body.data.map { Data(buffer: $0) } ?? Data()

        var env: [String: String] = [
            "GIT_PROJECT_ROOT": repoRoot,
            "GIT_HTTP_EXPORT_ALL": "1",
            "PATH_INFO": req.url.path,
            "QUERY_STRING": req.url.query ?? "",
            "REQUEST_METHOD": req.method.rawValue,
            "CONTENT_TYPE": req.headers.first(name: .contentType) ?? "",
            "CONTENT_LENGTH": "\(bodyData.count)",
            "REMOTE_ADDR": req.remoteAddress?.ipAddress ?? ""
        ]

        if let remoteUser {
            env["REMOTE_USER"] = remoteUser
        }

        let process = try ProcessRunner.run(
            executable: "/usr/bin/env",
            arguments: ["git", "http-backend"],
            environment: env,
            stdin: bodyData
        )

        guard process.status == 0 else {
            let stderr = String(decoding: process.stderr, as: UTF8.self)
            throw Abort(.internalServerError, reason: stderr)
        }

        return try parseCGIResponse(process.stdout, allocator: req.byteBufferAllocator)
    }

    private func parseCGIResponse(_ data: Data, allocator: ByteBufferAllocator) throws -> SmartHTTPResult {
        let separatorCRLF = Data([13, 10, 13, 10])
        let separatorLF = Data([10, 10])

        let headerEnd: Range<Data.Index>
        let sepLength: Int
        if let r = data.range(of: separatorCRLF) {
            headerEnd = r
            sepLength = 4
        } else if let r = data.range(of: separatorLF) {
            headerEnd = r
            sepLength = 2
        } else {
            throw Abort(.internalServerError, reason: "Malformed CGI headers")
        }

        let headerData = data.subdata(in: 0..<headerEnd.lowerBound)
        let bodyData = data.subdata(in: (headerEnd.lowerBound + sepLength)..<data.count)

        guard let headerText = String(data: headerData, encoding: .utf8) ?? String(data: headerData, encoding: .isoLatin1) else {
            throw Abort(.internalServerError, reason: "Invalid CGI header encoding")
        }

        var status: HTTPStatus = .ok
        var headers = HTTPHeaders()

        for line in headerText.split(whereSeparator: { $0.isNewline }) {
            let row = String(line)
            if row.lowercased().hasPrefix("status:") {
                let value = row.dropFirst("Status:".count).trimmingCharacters(in: .whitespaces)
                let code = value.split(separator: " ").first.flatMap { Int($0) } ?? 200
                status = HTTPStatus(statusCode: code)
                continue
            }

            let pair = row.split(separator: ":", maxSplits: 1).map(String.init)
            if pair.count == 2 {
                headers.add(name: pair[0].trimmingCharacters(in: .whitespaces), value: pair[1].trimmingCharacters(in: .whitespaces))
            }
        }

        var body = allocator.buffer(capacity: bodyData.count)
        body.writeBytes(bodyData)
        return SmartHTTPResult(status: status, headers: headers, body: body)
    }
}
