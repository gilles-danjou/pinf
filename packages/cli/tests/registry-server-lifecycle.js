
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var OS = require("os");
var TUSK = require("narwhal/tusk/tusk");
var PINF = require("pinf", "github.com/cadorn/pinf/raw/master/cli");
var JSON = require("json");
var FILE = require("file");
var OS = require("os");


var filesPath = FILE.Path(module.path).dirname().join("_files");


exports.testLifecycle = function() {
    
    var tusk = TUSK.Tusk().activate(),
        seaPath = tusk.getSea().getPath();
    
    var tmpDBPath = seaPath.join("build", "cli", "test", "db");
    if(tmpDBPath.exists()) {
        OS.command("rm -Rf " + tmpDBPath);
    }
    tmpDBPath.mkdirs();
    
    var file;
    
    resetFiles();
    initFiles();

    tusk.command("pinf --db " + tmpDBPath + " register-namespace http://127.0.0.1:8080/test@pinf.org/public/");
    tusk.command("pinf --db " + tmpDBPath + " register-package test@pinf.org/public " + filesPath.join("test-package-1").valueOf());
    
    ASSERT.deepEqual(
        JSON.decode(filesPath.join("test-package-1", "package.json").read()),
        {
            "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-1/",
            "name": "test-package-1"
        }
    );
    
    file = filesPath.join("test-package-1");
    OS.command("cd " + file.valueOf() + "; git add . ; git commit -m 'registered' ; git tag v0.2.0");
    
    

//    resetFiles();



//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db announce-release --branch master /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/packages/cli/tests/_files/test-package-1
//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db announce-release --branch test /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/packages/cli/tests/_files/test-package-1
//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db announce-release /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/packages/cli/tests/_files/test-package-1
//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db announce-release --major 0 /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/packages/cli/tests/_files/test-package-1


//pinf --db /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/build/cli/test/db register-release test@pinf.org/public /pinf/packages-birth/PINF/OpenSource/org.cadorn.github/packages/pinf/packages/cli/tests/_files/test-package-1


}


function resetFiles() {

    var file;

    // delete 'uid' property from test package descriptor
    file = filesPath.join("test-package-1", "package.json");
    var descriptor = JSON.decode(file.read());
    delete descriptor.uid;
    file.write(JSON.encode(descriptor, null, '    '));
    
    
    file = filesPath.join("test-package-1", ".git");
    OS.command("rm -Rf " + file.valueOf());
    
}

function initFiles() {
    
    var file;

    file = filesPath.join("test-package-1");
    OS.command("cd " + file.valueOf() + "; git init; git add . ; git commit -m 'base' ; git tag v0.1.0");
    
}


if (require.main == module.id)
    require("os").exit(require("test").run(exports));
