// The app only schedules local notifications. Dropping the remote-push entitlement lets the
// iOS build be signed with a free Apple ID (Sideloadly / AltStore), which can't sign aps-environment.
// Runs as a finalized mod so it applies after expo-notifications has written its entitlement.
const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  if (config.ios?.entitlements) delete config.ios.entitlements['aps-environment'];
  return withFinalizedMod(config, [
    'ios',
    async (c) => {
      const root = c.modRequest.platformProjectRoot;
      for (const dir of fs.readdirSync(root)) {
        const full = path.join(root, dir);
        if (!fs.statSync(full).isDirectory()) continue;
        for (const f of fs.readdirSync(full).filter((x) => x.endsWith('.entitlements'))) {
          const file = path.join(full, f);
          const xml = fs.readFileSync(file, 'utf8').replace(/\s*<key>aps-environment<\/key>\s*<string>[^<]*<\/string>/, '');
          fs.writeFileSync(file, xml);
        }
      }
      return c;
    },
  ]);
};
