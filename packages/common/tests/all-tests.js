
exports.testPackageStore = require("./package/store");
exports.testProgramStore = require("./program/store");

if (require.main == module) {
    require("os").exit(require("test").run(exports));
}