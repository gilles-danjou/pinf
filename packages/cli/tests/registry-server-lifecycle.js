
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var OS = require("os");
var TUSK = require("narwhal/tusk/tusk");
var PINF = require("pinf", "github.com/cadorn/pinf/raw/master/cli");

exports.testLifecycle = function() {
    
    var tusk = TUSK.Tusk().activate(),
        seaPath = tusk.getSea().getPath();
    
    var tmpDBPath = seaPath.join("build", "cli", "test", "db");
    if(tmpDBPath.exists()) {
        OS.command("rm -Rf " + tmpDBPath);
    }
    tmpDBPath.mkdirs();

    tusk.command("pinf --db " + tmpDBPath + " register-namespace http://127.0.0.1:8080/test@pinf.org/public/");


//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db register-package test@pinf.org/public /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/util


}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));
