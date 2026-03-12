import Vapor

public func routes(_ app: Application) throws {
    let authController = AuthController()
    let repoController = RepositoryController()
    let gitController = GitHTTPController()
    let userController = UserController()
    let sshKeyController = SSHKeyController()

    app.get { req in
        if req.auth.has(User.self) {
            return req.redirect(to: "/repos")
        }
        return req.redirect(to: "/login")
    }

    app.get("login", use: authController.loginPage)
    app.post("login", use: authController.login)
    app.post("logout", use: authController.logout)

    let protectedWeb = app.grouped(User.redirectMiddleware(path: "/login"))
    protectedWeb.get("repos", use: repoController.listPage)
    protectedWeb.get("repos", "new", use: repoController.createPage)
    protectedWeb.post("repos", use: repoController.create)
    protectedWeb.get("repos", ":owner", ":repo", use: repoController.detailPage)
    protectedWeb.get("repos", ":owner", ":repo", "branches", use: repoController.branchesPage)
    protectedWeb.get("repos", ":owner", ":repo", "commits", use: repoController.commitsPage)
    protectedWeb.get("repos", ":owner", ":repo", "commit", ":revision", use: repoController.commitDetailPage)
    protectedWeb.get("repos", ":owner", ":repo", "tree", ":branch", "**", use: repoController.treePage)
    protectedWeb.get("repos", ":owner", ":repo", "blob", ":branch", "**", use: repoController.blobPage)
    protectedWeb.get("admin", "users", use: userController.usersPage)
    protectedWeb.post("admin", "users", use: userController.createUser)
    protectedWeb.post("admin", "users", ":id", "update", use: userController.updateUser)
    protectedWeb.post("admin", "users", ":id", "delete", use: userController.deleteUser)
    protectedWeb.get("settings", "ssh-keys", use: sshKeyController.listPage)
    protectedWeb.post("settings", "ssh-keys", use: sshKeyController.create)
    protectedWeb.post("settings", "ssh-keys", ":id", "update", use: sshKeyController.update)
    protectedWeb.post("settings", "ssh-keys", ":id", "delete", use: sshKeyController.delete)

    let api = app.grouped("api")
    api.post("auth", "login", use: authController.apiLogin)

    let protectedAPI = api.grouped(User.guardMiddleware())
    protectedAPI.post("repos", use: repoController.apiCreate)
    protectedAPI.get("repos", use: repoController.apiList)
    protectedAPI.get("repos", ":owner", ":repo", use: repoController.apiDetail)
    protectedAPI.get("repos", ":owner", ":repo", "branches", use: repoController.apiBranches)
    protectedAPI.get("repos", ":owner", ":repo", "commits", use: repoController.apiCommits)
    protectedAPI.get("repos", ":owner", ":repo", "commits", ":revision", use: repoController.apiCommitDetail)
    protectedAPI.get("repos", ":owner", ":repo", "tree", ":branch", "**", use: repoController.apiTree)
    protectedAPI.get("repos", ":owner", ":repo", "blob", ":branch", "**", use: repoController.apiBlob)
    protectedAPI.delete("repos", ":owner", ":repo", use: repoController.apiDelete)
    protectedAPI.get("admin", "users", use: userController.apiListUsers)
    protectedAPI.post("admin", "users", use: userController.apiCreateUser)
    protectedAPI.put("admin", "users", ":id", use: userController.apiUpdateUser)
    protectedAPI.delete("admin", "users", ":id", use: userController.apiDeleteUser)
    protectedAPI.get("ssh-keys", use: sshKeyController.apiList)
    protectedAPI.post("ssh-keys", use: sshKeyController.apiCreate)
    protectedAPI.put("ssh-keys", ":id", use: sshKeyController.apiUpdate)
    protectedAPI.delete("ssh-keys", ":id", use: sshKeyController.apiDelete)

    app.on(.GET, [":owner", ":repoGit", "info", "refs"], use: gitController.infoRefs)
    app.on(.POST, [":owner", ":repoGit", "git-upload-pack"], use: gitController.uploadPack)
    app.on(.POST, [":owner", ":repoGit", "git-receive-pack"], use: gitController.receivePack)

    app.post("admin", "bootstrap", use: userController.bootstrapAdmin)
}
