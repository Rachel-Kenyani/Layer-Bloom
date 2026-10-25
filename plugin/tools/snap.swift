// Usage: snap <page.html> <out-prefix> <script>... — runs each script in a WebKit view and saves <out-prefix>-<n>.png
// Size defaults to the plugin window; set SNAP_WIDTH and SNAP_HEIGHT to change it.
import AppKit
import WebKit

let args = CommandLine.arguments
let html = try! String(contentsOfFile: args[1], encoding: .utf8)
let prefix = args[2]
let shots = Array(args.dropFirst(3))
let env = ProcessInfo.processInfo.environment
let width = Double(env["SNAP_WIDTH"] ?? "380")!
let height = Double(env["SNAP_HEIGHT"] ?? "600")!

class Snapper: NSObject, WKNavigationDelegate {
    let view = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height))
    var index = 0
    override init() {
        super.init()
        view.navigationDelegate = self
        // Stand-in for Figma: swallow messages to "parent".
        view.loadHTMLString(html.replacingOccurrences(of: "<div id=\"app\"></div>", with: "<div id=\"app\"></div><script>window.parent = { postMessage(){} };</script>"), baseURL: URL(string: "https://www.figma.com"))
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { self.next() } }
    func next() {
        guard index < shots.count else { exit(0) }
        view.evaluateJavaScript(shots[index]) { _, error in
            if let error { print("script \(self.index) error: \(error)") }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                self.view.takeSnapshot(with: nil) { image, _ in
                    let rep = NSBitmapImageRep(data: image!.tiffRepresentation!)!
                    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(prefix)-\(self.index).png"))
                    self.index += 1
                    self.next()
                }
            }
        }
    }
}

let app = NSApplication.shared
let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: width, height: height), styleMask: [.borderless], backing: .buffered, defer: false)
let snapper = Snapper()
window.contentView = snapper.view
app.run()
