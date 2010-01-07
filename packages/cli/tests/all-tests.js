
//exports.testRegistryServer = require("./registry-server");

if (require.main == module) {
    require("os").exit(require("test").run(exports));
}