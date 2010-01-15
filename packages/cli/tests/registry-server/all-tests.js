
exports.testLifecycle = require("./lifecycle");

if (require.main == module) {
    require("os").exit(require("test").run(exports));
}