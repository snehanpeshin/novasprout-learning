import crypto from "node:crypto";
export function isAdminAllowed(request: Request) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN?.trim() || "";
  const provided = request.headers.get("x-admin-token")?.trim() || "";
  return Boolean(expected && Buffer.byteLength(expected) === Buffer.byteLength(provided) &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided)));
}
