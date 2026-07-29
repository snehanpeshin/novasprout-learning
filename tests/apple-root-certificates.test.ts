import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { appleRootCertificates } from "../app/lib/appleRootCertificates.ts";

const certificateNames = [
  "AppleIncRootCertificate.cer",
  "AppleRootCA-G2.cer",
  "AppleRootCA-G3.cer"
];

test("embedded Apple root certificates match their checked-in DER files", async () => {
  const sourceCertificates = await Promise.all(
    certificateNames.map((name) =>
      readFile(path.join(process.cwd(), "app/lib/apple-root-certificates", name))
    )
  );

  assert.equal(appleRootCertificates.length, sourceCertificates.length);
  sourceCertificates.forEach((certificate, index) => {
    assert.deepEqual(appleRootCertificates[index], certificate);
  });
});
