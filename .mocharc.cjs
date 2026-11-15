"use strict";
/* mocha runs the TypeScript directly through ts-node so coverage tools
 * instrument the .ts source rather than remapped compiled output. */
module.exports = {
  require: ["ts-node/register"],
  spec: ["tests/**/*.spec.ts"],
  extension: ["ts"],
  timeout: 20000,
  recursive: true,
  reporter: "spec",
};
