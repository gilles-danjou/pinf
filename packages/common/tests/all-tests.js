
exports.testPackageStore = require("./package/store");

if (require.main == module) {
    require("os").exit(require("test").run(exports));
}