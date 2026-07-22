import Foundation
import Security
import StoreKit

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

@MainActor
final class PurchaseManager: ObservableObject {
    static let singleLessonProductID = "com.karigarihome.novasprout.lesson.single"
    static let monthlyProductID = "com.karigarihome.novasprout.subscription.monthly"

    @Published private(set) var products: [Product] = []
    @Published private(set) var isLoading = false
    @Published private(set) var isPurchasing = false
    @Published private(set) var monthlyTransactionJWS = ""
    @Published private(set) var pendingLessonTransactionJWS = ""
    @Published private(set) var statusMessage = ""

    private var pendingLessonTransaction: Transaction?
    private var updatesTask: Task<Void, Never>?
    private let defaults = UserDefaults.standard
    private let activeJWSKey = "novasprout.activeLessonTransactionJWS"
    private let activeExpiryKey = "novasprout.activeLessonTransactionExpiry"

    init() {
        updatesTask = Task { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                await self.handleUpdatedTransaction(result)
            }
        }
        Task { await refresh() }
    }

    var singleLessonProduct: Product? {
        products.first { $0.id == Self.singleLessonProductID }
    }

    var monthlyProduct: Product? {
        products.first { $0.id == Self.monthlyProductID }
    }

    var hasMonthlyAccess: Bool {
        !monthlyTransactionJWS.isEmpty
    }

    var activeLessonTransactionJWS: String {
        guard defaults.double(forKey: activeExpiryKey) > Date().timeIntervalSince1970 else {
            return ""
        }
        return defaults.string(forKey: activeJWSKey) ?? ""
    }

    func accessForNewLesson(betaCode: String) -> AIRequestAccess {
        let trimmedBetaCode = betaCode.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedBetaCode.isEmpty {
            return AIRequestAccess(appleTransactionJWS: "", betaCode: trimmedBetaCode)
        }
        return AIRequestAccess(
            appleTransactionJWS: monthlyTransactionJWS.isEmpty
                ? pendingLessonTransactionJWS
                : monthlyTransactionJWS,
            betaCode: ""
        )
    }

    func accessForDeck(betaCode: String) -> AIRequestAccess {
        let trimmedBetaCode = betaCode.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedBetaCode.isEmpty {
            return AIRequestAccess(appleTransactionJWS: "", betaCode: trimmedBetaCode)
        }
        let purchaseJWS = monthlyTransactionJWS.isEmpty
            ? (activeLessonTransactionJWS.isEmpty ? pendingLessonTransactionJWS : activeLessonTransactionJWS)
            : monthlyTransactionJWS
        return AIRequestAccess(
            appleTransactionJWS: purchaseJWS,
            betaCode: ""
        )
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        do {
            products = try await Product.products(for: [
                Self.singleLessonProductID,
                Self.monthlyProductID
            ]).sorted { $0.price < $1.price }
        } catch {
            statusMessage = "The App Store products are not available right now."
        }

        monthlyTransactionJWS = ""
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  transaction.productID == Self.monthlyProductID,
                  transaction.revocationDate == nil,
                  (transaction.expirationDate ?? .distantPast) > Date() else { continue }
            monthlyTransactionJWS = result.jwsRepresentation
        }

        for await result in Transaction.unfinished {
            guard case .verified(let transaction) = result,
                  transaction.productID == Self.singleLessonProductID else { continue }
            pendingLessonTransaction = transaction
            pendingLessonTransactionJWS = result.jwsRepresentation
            break
        }
    }

    func purchase(_ product: Product) async {
        isPurchasing = true
        statusMessage = ""
        defer { isPurchasing = false }
        do {
            switch try await product.purchase() {
            case .success(let result):
                guard case .verified(let transaction) = result else {
                    statusMessage = "The App Store could not verify this purchase."
                    return
                }
                if transaction.productID == Self.singleLessonProductID {
                    pendingLessonTransaction = transaction
                    pendingLessonTransactionJWS = result.jwsRepresentation
                    statusMessage = "One AI lesson is ready to create."
                } else if transaction.productID == Self.monthlyProductID {
                    monthlyTransactionJWS = result.jwsRepresentation
                    await transaction.finish()
                    statusMessage = "Monthly AI Tutor access is active."
                }
            case .pending:
                statusMessage = "The purchase is waiting for approval."
            case .userCancelled:
                break
            @unknown default:
                statusMessage = "The purchase could not be completed."
            }
        } catch {
            statusMessage = "The purchase could not be completed. Please try again."
        }
    }

    func markSingleLessonStarted(using access: AIRequestAccess) async {
        guard !pendingLessonTransactionJWS.isEmpty,
              access.appleTransactionJWS == pendingLessonTransactionJWS else { return }
        defaults.set(pendingLessonTransactionJWS, forKey: activeJWSKey)
        defaults.set(Date().addingTimeInterval(6 * 60 * 60).timeIntervalSince1970, forKey: activeExpiryKey)
        if let pendingLessonTransaction {
            await pendingLessonTransaction.finish()
        }
        self.pendingLessonTransaction = nil
        pendingLessonTransactionJWS = ""
    }

    func finishActiveLesson() {
        defaults.removeObject(forKey: activeJWSKey)
        defaults.removeObject(forKey: activeExpiryKey)
    }

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await refresh()
            statusMessage = hasMonthlyAccess
                ? "Monthly access restored."
                : "Your purchases are up to date."
        } catch {
            statusMessage = "Purchases could not be restored right now."
        }
    }

    private func handleUpdatedTransaction(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let transaction) = result else { return }
        if transaction.productID == Self.monthlyProductID {
            await refresh()
            await transaction.finish()
        } else if transaction.productID == Self.singleLessonProductID {
            pendingLessonTransaction = transaction
            pendingLessonTransactionJWS = result.jwsRepresentation
        }
    }
}
