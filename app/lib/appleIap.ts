import { readFileSync } from "fs";
import path from "path";
import {
  Environment,
  SignedDataVerifier,
  Type,
  type JWSTransactionDecodedPayload
} from "@apple/app-store-server-library";

export const appleSingleLessonProductId =
  process.env.APPLE_IAP_SINGLE_LESSON_PRODUCT_ID?.trim() ||
  "com.karigarihome.novasprout.lesson.single";

export const appleMonthlyProductId =
  process.env.APPLE_IAP_MONTHLY_PRODUCT_ID?.trim() ||
  "com.karigarihome.novasprout.subscription.monthly";

export type VerifiedAppleAccess = {
  expiresDate: number | null;
  kind: "single_lesson" | "subscription";
  originalTransactionId: string;
  productId: string;
  transactionId: string;
};

const certificateNames = [
  "AppleIncRootCertificate.cer",
  "AppleRootCA-G2.cer",
  "AppleRootCA-G3.cer"
];

let rootCertificates: Buffer[] | null = null;

function loadAppleRootCertificates() {
  if (!rootCertificates) {
    rootCertificates = certificateNames.map((name) =>
      readFileSync(path.join(process.cwd(), "app/lib/apple-root-certificates", name))
    );
  }
  return rootCertificates;
}

function verifier(environment: Environment) {
  const appAppleId = Number(process.env.APPLE_APP_ID);
  return new SignedDataVerifier(
    loadAppleRootCertificates(),
    true,
    environment,
    "com.karigarihome.novasprout",
    environment === Environment.PRODUCTION && Number.isFinite(appAppleId) ? appAppleId : undefined
  );
}

function validAccess(payload: JWSTransactionDecodedPayload): VerifiedAppleAccess | null {
  if (!payload.transactionId || !payload.productId || payload.revocationDate) {
    return null;
  }

  if (
    payload.productId === appleMonthlyProductId &&
    payload.type === Type.AUTO_RENEWABLE_SUBSCRIPTION &&
    (payload.expiresDate ?? 0) > Date.now() &&
    !payload.isUpgraded
  ) {
    return {
      expiresDate: payload.expiresDate ?? null,
      kind: "subscription",
      originalTransactionId: payload.originalTransactionId ?? payload.transactionId,
      productId: payload.productId,
      transactionId: payload.transactionId
    };
  }

  if (payload.productId === appleSingleLessonProductId && payload.type === Type.CONSUMABLE) {
    return {
      expiresDate: null,
      kind: "single_lesson",
      originalTransactionId: payload.originalTransactionId ?? payload.transactionId,
      productId: payload.productId,
      transactionId: payload.transactionId
    };
  }

  return null;
}

export async function verifyAppleTransactionJws(jws: string) {
  if (!jws || jws.length > 24_000) {
    return null;
  }

  const environments = Number.isFinite(Number(process.env.APPLE_APP_ID))
    ? [Environment.PRODUCTION, Environment.SANDBOX]
    : [Environment.SANDBOX];

  for (const environment of environments) {
    try {
      const payload = await verifier(environment).verifyAndDecodeTransaction(jws);
      const access = validAccess(payload);
      if (access) return access;
    } catch {
      // App Review transactions are sandbox transactions, while customer
      // transactions are production. Try the other trusted Apple environment.
    }
  }

  return null;
}
