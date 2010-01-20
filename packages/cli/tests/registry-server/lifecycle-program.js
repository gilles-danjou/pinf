
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var OS = require("os");
var TUSK = require("narwhal/tusk/tusk");
var JSON = require("json");
var FILE = require("file");


var filesPath = FILE.Path(module.path).dirname().join("_files");


// setup

var tusk = TUSK.getActive() || TUSK.Tusk().activate(),
    seaPath = tusk.getSea().getPath();

var tmpDBPath = seaPath.join("build", "cli", "test", "db");



exports.testProgramCreation = function() {
    
    // TODO @see pinf/packages/common/tests/program/store.js

}


if (require.main == module.id)
    require("os").exit(require("test").run(exports));
