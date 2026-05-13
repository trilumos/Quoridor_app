const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const src = path.join(
        config.modRequest.projectRoot,
        "assets",
        "adi-registration.properties"
      );

      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets"
      );

      const dest = path.join(
        destDir,
        "adi-registration.properties"
      );

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);

      const copied = fs.readFileSync(dest, "utf8");

      console.log("[AdiRegistration] copied:", src);
      console.log("[AdiRegistration] to:", dest);
      console.log("[AdiRegistration] token:", JSON.stringify(copied));
      console.log("[AdiRegistration] length:", copied.length);

      return config;
    },
  ]);
};