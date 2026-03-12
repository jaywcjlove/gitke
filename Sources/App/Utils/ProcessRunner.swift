import Foundation
import Vapor

struct ProcessOutput {
    let status: Int32
    let stdout: Data
    let stderr: Data
}

enum ProcessRunner {
    static func run(
        executable: String,
        arguments: [String],
        environment: [String: String] = [:],
        stdin: Data? = nil
    ) throws -> ProcessOutput {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = arguments

        var env = ProcessInfo.processInfo.environment
        for (k, v) in environment {
            env[k] = v
        }
        process.environment = env

        let outPipe = Pipe()
        let errPipe = Pipe()
        process.standardOutput = outPipe
        process.standardError = errPipe

        if let stdin {
            let inPipe = Pipe()
            process.standardInput = inPipe
            try process.run()
            inPipe.fileHandleForWriting.write(stdin)
            try? inPipe.fileHandleForWriting.close()
        } else {
            try process.run()
        }

        process.waitUntilExit()
        let stdout = outPipe.fileHandleForReading.readDataToEndOfFile()
        let stderr = errPipe.fileHandleForReading.readDataToEndOfFile()
        return ProcessOutput(status: process.terminationStatus, stdout: stdout, stderr: stderr)
    }

    static func runGit(args: [String], environment: [String: String] = [:], stdin: Data? = nil) throws -> ProcessOutput {
        try run(executable: "/usr/bin/env", arguments: ["git"] + args, environment: environment, stdin: stdin)
    }
}
