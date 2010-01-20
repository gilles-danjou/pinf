
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

/**
 * NOTE: These tests depend on packages/cli/tests/registry-server/lifecycle.js
 */

var ASSERT = require("assert");
var FILE = require("file");
var OS = require("os");
var JSON = require("json");
var STORE = require("package/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var LOCATOR = require("package/locator", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SOURCES = require("package/sources", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var SEMVER = require("semver", "github.com/cadorn/util/raw/master/lib-js");

exports.testPopulate = function() {
    
    var storePath = FILE.Path(module.path).dirname().join("../../.tmp/package-store");
    if(storePath.exists()) {
        OS.command("rm -Rf " + storePath);
    }

    var store = STORE.PackageStore(storePath),
        pkg,
        basename,
        path;


    pkg = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3"
    }));

    ASSERT.equal(pkg.getPath().dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = pkg.getPath().basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"numericOnly":false}));
    ASSERT.deepEqual(
        JSON.decode(pkg.getPath().join("package.json").read()),
        {
          "uid": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3/",
          "name": "test-package-3",
          "repositories": [
            {
              "type": "git",
              "url": "git://github.com/cadorn/pinf.git",
              "path": "packages/cli/tests/registry-server/_files/test-package-3",
              "raw": "http://github.com/cadorn/pinf/raw/{rev}/packages/cli/tests/registry-server/_files/test-package-3/{path}",
              "download": {
                "type": "zip",
                "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
              }
            }
          ],
          "version": "0.1.2"
        }
    );

    pkg = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "master"
    }));
    
    ASSERT.equal(pkg.getPath().dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = pkg.getPath().basename().valueOf();
    ASSERT.ok(/^0\.0\.0rev-.*$/.test(basename));

    pkg = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "0.1.0"
    }));

    ASSERT.equal(pkg.getPath().dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = pkg.getPath().basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"numericOnly":false}));


    pkg = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "0.1.3rc1"
    }));

    ASSERT.equal(pkg.getPath().dirname().valueOf(), storePath.join("packages/registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3").valueOf());
    basename = pkg.getPath().basename().valueOf();
    ASSERT.ok(!!SEMVER.validate(basename, {"withSuffix":true}));
    ASSERT.deepEqual(
        JSON.decode(pkg.getPath().join("package.json").read()),
        {
           "uid": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3/",
           "name": "test-package-3",
           "repositories": [
              {
                 "type": "git",
                 "url": "git://github.com/cadorn/pinf.git",
                 "path": "packages/cli/tests/registry-server/_files/test-package-3",
                 "raw": "http://github.com/cadorn/pinf/raw/{rev}/packages/cli/tests/registry-server/_files/test-package-3/{path}",
                 "download": {
                    "type": "zip",
                    "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
                 }
              }
           ],
           "version": "0.1.3rc1"
        }
    );


    var sourcesPath = storePath.join("sources.json"),
        path = FILE.Path(module.path).dirname().join("../../../cli/tests/registry-server/_files/test-package-3").valueOf();
    sourcesPath.write(JSON.encode({
        "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json": {
            "test-package-3": {
                "0.1.3rc": {
                    "path": path
                }
            }
        }
    }, null, "  "));
    store.setSources(SOURCES.PackageSources(sourcesPath));

    pkg = store.get(LOCATOR.PackageLocator({
        "catalog": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/catalog.json",
        "name": "test-package-3",
        "revision": "0.1.3rc1"
    }));

    ASSERT.equal(pkg.getPath().valueOf(), path);
    ASSERT.deepEqual(
        JSON.decode(pkg.getPath().join("package.json").read()),
        {
            "uid": "http://registry.pinf.org/christoph@christophdorn.com/pinf-registry-test/test-package-3/",
            "name": "test-package-3",
            "repositories": [
                {
                    "type": "git", 
                    "url": "git://github.com/cadorn/pinf.git",
                    "path": "packages/cli/tests/registry-server/_files/test-package-3"
                }
            ]
        }
    );
}

if (require.main == module.id)
    require("os").exit(require("test").run(exports));
