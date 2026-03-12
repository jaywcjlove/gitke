import Foundation

struct MarkdownService {
    func renderHTML(_ markdown: String) -> String {
        let escaped = markdown
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")

        return escaped
            .split(separator: "\n", omittingEmptySubsequences: false)
            .map { line -> String in
                if line.hasPrefix("### ") {
                    return "<h3>\(line.dropFirst(4))</h3>"
                }
                if line.hasPrefix("## ") {
                    return "<h2>\(line.dropFirst(3))</h2>"
                }
                if line.hasPrefix("# ") {
                    return "<h1>\(line.dropFirst(2))</h1>"
                }
                return "<p>\(line)</p>"
            }
            .joined(separator: "\n")
    }
}
