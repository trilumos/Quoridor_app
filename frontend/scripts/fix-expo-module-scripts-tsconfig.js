/* global __dirname */

const fs = require("fs");
const path = require("path");

const packageDir = path.resolve(__dirname, "..");
const moduleDir = path.join(packageDir, "node_modules", "expo-module-scripts");
const baseJsonPath = path.join(moduleDir, "tsconfig.base.json");
const shimPath = path.join(moduleDir, "tsconfig.base");
const packageJsonPath = path.join(moduleDir, "package.json");

function run() {
  if (!fs.existsSync(moduleDir) || !fs.existsSync(baseJsonPath)) {
    return;
  }

  if (!fs.existsSync(shimPath)) {
    const shim = {
      extends: "./tsconfig.base.json",
    };

    fs.writeFileSync(shimPath, JSON.stringify(shim, null, 2) + "\n", "utf8");
    console.log(
      "Created expo-module-scripts tsconfig.base shim for TypeScript compatibility.",
    );
  }

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  pkg.exports = pkg.exports || {};

  if (!pkg.exports["./tsconfig.base"]) {
    pkg.exports["./tsconfig.base"] = "./tsconfig.base.json";
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(pkg, null, 2) + "\n",
      "utf8",
    );
    console.log("Patched expo-module-scripts exports with ./tsconfig.base.");
  }
}

run();
