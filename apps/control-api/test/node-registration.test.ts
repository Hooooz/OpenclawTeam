import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadModule() {
  const moduleUrl = `${pathToFileURL(path.resolve("src/node-registration.ts")).href}?t=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

test("buildNodeRegistrationBundle returns installer scripts", async () => {
  const { buildNodeRegistrationBundle } = await loadModule();
  const bundle = buildNodeRegistrationBundle({
    managerUrl: "http://100.80.81.15:3201",
    collectorToken: "openclaw-collector",
  });

  assert.equal(bundle.managerUrl, "http://100.80.81.15:3201");
  assert.equal(bundle.installers.length, 3);

  const linux = bundle.installers.find((item: { platform: string }) => item.platform === "linux");
  const macos = bundle.installers.find((item: { platform: string }) => item.platform === "macos");
  const windows = bundle.installers.find((item: { platform: string }) => item.platform === "windows");

  assert.ok(linux);
  assert.ok(macos);
  assert.ok(windows);
  assert.match(linux.script, /MANAGER_URL="http:\/\/100\.80\.81\.15:3201"/);
  assert.match(linux.script, /npm run collector:push --workspace @openclaw\/control-api/);
  assert.match(macos.script, /OPENCLAW_HOME="\$HOME\/\.openclaw"/);
  assert.match(windows.script, /\$env:COLLECTOR_MANAGER_URL = "http:\/\/100\.80\.81\.15:3201"/);
  assert.match(windows.script, /npm run collector:push --workspace @openclaw\/control-api/);
});

test("buildNodeRegistrationBundle masks the shared token in the summary", async () => {
  const { buildNodeRegistrationBundle } = await loadModule();
  const bundle = buildNodeRegistrationBundle({
    managerUrl: "http://127.0.0.1:3201",
    collectorToken: "super-secret-token",
  });

  assert.equal(bundle.collectorTokenHint, "supe...oken");
  assert.doesNotMatch(bundle.installers[0]?.script || "", /supe\.\.\.oken/);
  assert.match(bundle.installers[0]?.script || "", /super-secret-token/);
});
