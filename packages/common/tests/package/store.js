
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var FILE = require("file");
var OS = require("os");
var STORE = require("package/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var LOCATOR = require("package/locator", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SEMVER = require("semver", "github.com/cadorn/util/raw/master/lib-js");

exports.testPopulate = function() {
    
    var storePath = FILE.Path(module.path).dirname().join("../../.tmp/store");
    if(storePath.exists()) {
//        OS.command("rm -Rf " + storePath);
    }

    var store = STORE.PackageStore(storePath),
        file,
        basename;


    file = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3"
    }));
    
    ASSERT.equal(file.dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = file.basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"numericOnly":false}));
    
    file = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "master"
    }));
    
    ASSERT.equal(file.dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = file.basename().valueOf();
    ASSERT.ok(/^0\.0\.0rev-.*$/.test(basename));

    file = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "0.1.0"
    }));

    ASSERT.equal(file.dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = file.basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"numericOnly":false}));


    file = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "0.1.0alpha"
    }));

    ASSERT.equal(file.dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = file.basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"withSuffix":true}));

}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));
