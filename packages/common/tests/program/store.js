
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

/**
 * NOTE: These tests depend on packages/cli/tests/registry-server/lifecycle.js running first
 */

var ASSERT = require("assert");
var FILE = require("file");
var UTIL = require("util");
var OS = require("os");
var PACKAGE_STORE = require("package/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var PROGRAM_STORE = require("program/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var LOCATOR = require("package/locator", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SOURCES = require("package/sources", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SEMVER = require("semver", "github.com/cadorn/util/raw/master/lib-js");
var GIT = require("revision-control/git", "github.com/cadorn/pinf/raw/master/cli");


var packageStorePath = FILE.Path(module.path).dirname().join("../../.tmp/package-store"),
    programStorePath = FILE.Path(module.path).dirname().join("../../.tmp/program-store");

if(packageStorePath.exists()) {
    OS.command("rm -Rf " + packageStorePath);
}
if(programStorePath.exists()) {
    OS.command("rm -Rf " + programStorePath);
}
packageStorePath.mkdirs();

var packageStore = PACKAGE_STORE.PackageStore(packageStorePath);
var programStore = PROGRAM_STORE.ProgramStore(programStorePath);
programStore.setPackageStore(packageStore);

exports.testBuild = function() {

    var program = programStore.get(LOCATOR.PackageLocator({
        "catalog": "http://127.0.0.1:8080/test@pinf.org/public/catalog.json",
        "name": "test-program-1",
        "revision": "master"
    }));

    program.build();
    
    var rev = GIT.Git(module.path).getLatestRevisionForBranch("master");
    
    ASSERT.deepEqual(
        JSON.decode(OS.command(program.getPath().join(".build", "bin", "cmd"))),
        {
           "local": {
              "module": {
                 "id": program.getPath().join(".build/using/127.0.0.1/test@pinf.org/public/test-package-6/0.0.0rev-"+rev+"/lib/module").valueOf(),
                 "path": program.getPath().join(".build/using/127.0.0.1/test@pinf.org/public/test-package-6/0.0.0rev-"+rev+"/lib/module.js").valueOf(),
                 "package": "127.0.0.1/test@pinf.org/public/test-package-6/0.0.0rev-"+rev,
                 "using": {
                    "test-package": "127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/0.0.0rev-"+rev
                 }
              }
           },
           "external": {
              "module": {
                 "id": program.getPath().join(".build/using/127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/0.0.0rev-"+rev+"/lib/module").valueOf(),
                 "path": program.getPath().join(".build/using/127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/0.0.0rev-"+rev+"/lib/module.js").valueOf(),
                 "package": "127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/0.0.0rev-"+rev,
                 "using": {}
              }
           },
           "memo": "This is the memo written by the builder"
        }
    );    
    
}

exports.testBuildWithSourcesOverlay = function() {

    var sourcesPath = packageStorePath.join("sources.json"),
        packagesBasePath = FILE.Path(module.path).dirname().join("../../../cli/tests/registry-server/_files/");
    sourcesPath.write(JSON.encode({
        "http://127.0.0.1:8080/test@pinf.org/public/catalog.json": {
            "test-program-1": {
                "master": {
                    "path": packagesBasePath.join("test-program-1").valueOf()
                }
            },
            "test-package-6": {
                "master": {
                    "path": packagesBasePath.join("test-package-6").valueOf()
                }
            }
        },
        "http://127.0.0.1:8080/test@pinf.org/public/subset/catalog.json": {
            "renamed-test-package-5": {
                "master": {
                    "path": packagesBasePath.join("test-package-5").valueOf()
                }
            }
        }
    }, null, "  "));
    packageStore.setSources(SOURCES.PackageSources(sourcesPath));


    var program = programStore.get(LOCATOR.PackageLocator({
        "catalog": "http://127.0.0.1:8080/test@pinf.org/public/catalog.json",
        "name": "test-program-1",
        "revision": "master"
    }));

    program.build();
    
    ASSERT.deepEqual(
        JSON.decode(OS.command(program.getPath().join(".build", "bin", "cmd"))),
        {
           "local": {
              "module": {
                 "id": program.getPath().canonical().join(".build/using/127.0.0.1/test@pinf.org/public/test-package-6/master/lib/module").valueOf(),
                 "path": program.getPath().canonical().join(".build/using/127.0.0.1/test@pinf.org/public/test-package-6/master/lib/module.js").valueOf(),
                 "package": "127.0.0.1/test@pinf.org/public/test-package-6/master",
                 "using": {
                    "test-package": "127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/master"
                 }
              }
           },
           "external": {
              "module": {
                 "id": program.getPath().canonical().join(".build/using/127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/master/lib/module").valueOf(),
                 "path": program.getPath().canonical().join(".build/using/127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/master/lib/module.js").valueOf(),
                 "package": "127.0.0.1/test@pinf.org/public/subset/renamed-test-package-5/master",
                 "using": {}
              }
           },
           "memo": "This is the memo written by the builder"
        }
    );    
}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));
