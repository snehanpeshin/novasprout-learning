import Foundation
import Security

enum SecureAccessStore {
    private static let service = "com.karigarihome.novasprout.beta-access"
    private static let account = "ai-access-code"

    static func read() -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return ""
        }
        return value
    }

    static func write(_ value: String) {
        let baseQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(baseQuery as CFDictionary)
        guard !value.isEmpty, let data = value.data(using: .utf8) else { return }
        var item = baseQuery
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(item as CFDictionary, nil)
    }
}

@MainActor
final class AppSettings: ObservableObject {
    @Published var accessCode: String
    @Published var statusMessage = ""

    init() {
        accessCode = SecureAccessStore.read()
    }

    var hasAccessCode: Bool {
        !accessCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func saveAccessCode() {
        accessCode = accessCode.trimmingCharacters(in: .whitespacesAndNewlines)
        SecureAccessStore.write(accessCode)
        statusMessage = accessCode.isEmpty ? "Beta access removed." : "Beta access saved securely."
    }

    func clearAccessCode() {
        accessCode = ""
        SecureAccessStore.write("")
        statusMessage = "Beta access removed."
    }
}
