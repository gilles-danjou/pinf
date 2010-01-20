
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var FILE = require("file");
var UTIL = require("util");
var OS = require("os");
var PACKAGE_STORE = require("package/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var PROGRAM_STORE = require("program/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var LOCATOR = require("package/locator", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SEMVER = require("semver", "github.com/cadorn/util/raw/master/lib-js");

exports.testBuild = function() {

    var packageStorePath = FILE.Path(module.path).dirname().join("../../.tmp/package-store"),
        programStorePath = FILE.Path(module.path).dirname().join("../../.tmp/program-store");

    if(packageStorePath.exists()) {
//        OS.command("rm -Rf " + packageStorePath);
    }
    if(programStorePath.exists()) {
//        OS.command("rm -Rf " + programStorePath);
    }

    var packageStore = PACKAGE_STORE.PackageStore(packageStorePath);

    var programStore = PROGRAM_STORE.ProgramStore(programStorePath);
    
    programStore.setPackageStore(packageStore);


    var program = programStore.get(LOCATOR.PackageLocator({
        "catalog": "http://127.0.0.1:8080/test@pinf.org/public/catalog.json",
        "name": "test-program-1",
        "revision": "master"
    }));

    program.build();





/*
    file = programStore.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3"
    }));
    
    ASSERT.equal(file.dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = file.basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"numericOnly":false}));
*/

}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));