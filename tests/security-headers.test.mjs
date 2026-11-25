import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config.ts";

async function getSecurityHeaders() {
  const rules = await nextConfig.headers();
  const rule = rules.find((item) => item.source === "/(.*)");
  assert.ok(rule);
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

function getDirectives(csp) {
  return Object.fromEntries(
    csp
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...sources] = directive.split(/\s+/);
        return [name, sources];
      }),
  );
}

test("CSP allows Razorpay checkout frames and telemetry without weakening framing protection", async () => {
  const headers = await getSecurityHeaders();
  const csp = headers["content-security-policy"];
  assert.ok(csp);

  const directives = getDirectives(csp);
  assert.ok(directives["script-src"].includes("https://checkout.razorpay.com"));
  assert.ok(directives["script-src"].includes("https://cdn.razorpay.com"));
  assert.ok(directives["img-src"].includes("https://cdn.razorpay.com"));
  assert.ok(directives["frame-src"].includes("https://checkout.razorpay.com"));
  assert.ok(directives["frame-src"].includes("https://api.razorpay.com"));
  assert.ok(directives["connect-src"].includes("https://api.razorpay.com"));
  assert.ok(directives["connect-src"].includes("https://lumberjack.razorpay.com"));
  assert.ok(!csp.includes("*.razorpay.com"));
  assert.deepEqual(directives["frame-ancestors"], ["'none'"]);
  assert.equal(headers["x-frame-options"], "DENY");
});
