
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var OS = require("os");
var TUSK = require("narwhal/tusk/tusk");
var PINF = require("pinf", "github.com/cadorn/pinf/raw/master/cli");
var JSON = require("json");
var FILE = require("file");
var HTTP = require("http");
var GIT = require("revision-control/git", "github.com/cadorn/pinf/raw/master/cli");


var filesPath = FILE.Path(module.path).dirname().join("_files");


// setup

var tusk = TUSK.Tusk().activate(),
    seaPath = tusk.getSea().getPath();

var tmpDBPath = seaPath.join("build", "cli", "test", "db");
if(tmpDBPath.exists()) {
    OS.command("rm -Rf " + tmpDBPath);
}
tmpDBPath.mkdirs();

resetFiles();
initFiles();


exports.testBasicRegistration = function() {
    
    var file,
        rev;

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

    tusk.command("pinf --db " + tmpDBPath + " announce-release " + file.valueOf());

        

    file = filesPath.join("test-package-2");
    OS.command("cd " + file.valueOf() + "; git branch test; git checkout test");

    tusk.command("pinf --db " + tmpDBPath + " register-package test@pinf.org/public " + filesPath.join("test-package-2").valueOf());

    file = filesPath.join("test-package-2");
    OS.command("cd " + file.valueOf() + "; git add . ; git commit -m 'registered'");
    
    tusk.command("pinf --db " + tmpDBPath + " announce-release --branch test " + file.valueOf());
    
    rev = GIT.Git(file).getLatestRevisionForBranch("test");

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/catalog.json").decodeToString()),
        {
          "uid": "http://127.0.0.1:8080/test@pinf.org/public/catalog.json",
          "packages": {
            "test-package-1": {
              "0": {
                "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-1/",
                "name": "test-package-1",
                "version": "0.2.0"
              }
            },
            "test-package-2": {
              "test": {
                "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-2/",
                "name": "test-package-2",
                "version": "0.0.0rev-" + rev
              }
            }
          }
        }
    );

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/test-package-1/").decodeToString()),
        {
          "name": "test-package-1",
          "versions": {
            "0": {
              "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-1/",
              "name": "test-package-1",
              "version": "0.2.0"
            }
          }
        }
    );

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/test-package-2/").decodeToString()),
        {
          "name": "test-package-2",
          "branches": {
            "test": {
              "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-2/",
              "name": "test-package-2",
              "version": "0.0.0rev-" + rev
            }
          }
        }
    );
    

    file = filesPath.join("test-package-5");
    
    tusk.command("pinf --db " + tmpDBPath + " register-package test@pinf.org/public " + file.valueOf());
    tusk.command("pinf --db " + tmpDBPath + " announce-release --branch master " + file.valueOf());

    rev = GIT.Git(file).getLatestRevisionForBranch("master");

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/test-package-5/").decodeToString()),
        {
          "name": "test-package-5",
          "branches": {
            "master": {
              "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-5/",
              "name": "test-package-5",
              "repositories": [
                  {
                      "type": "git", 
                      "url": "git://github.com/cadorn/pinf.git",
                      "path": "packages/cli/tests/registry-server/_files/test-package-5",
                      "raw": "http://github.com/cadorn/pinf/raw/{rev}/packages/cli/tests/registry-server/_files/test-package-5/{path}",
                      "download": {
                        "type": "zip",
                        "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
                      }
                  }
              ],
              "version": "0.0.0rev-" + rev
            }
          }
        }
    );
    
    
    tusk.command("pinf --db " + tmpDBPath + " register-namespace http://127.0.0.1:8080/test@pinf.org/public/subset/");

    tusk.command("pinf --db " + tmpDBPath + " register-package --name renamed-test-package-5 test@pinf.org/public/subset http://127.0.0.1:8080/test@pinf.org/public/test-package-5/");
    
    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/subset/catalog.json").decodeToString()),
        {
          "uid": "http://127.0.0.1:8080/test@pinf.org/public/subset/catalog.json",
          "packages": {
            "renamed-test-package-5": {
              "*": {
                "name": "test-package-5",
                "repositories": [
                   {
                      "type": "git",
                      "url": "git://github.com/cadorn/pinf.git",
                      "path": "packages/cli/tests/registry-server/_files/test-package-5",
                      "raw": "http://github.com/cadorn/pinf/raw/{rev}/packages/cli/tests/registry-server/_files/test-package-5/{path}",
                      "download": {
                         "type": "zip",
                         "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
                      }
                   }
                ]
              },
              "master": {
                "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-5/",
                "name": "test-package-5",
                "repositories": [
                  {
                    "type": "git",
                    "url": "git://github.com/cadorn/pinf.git",
                    "path": "packages/cli/tests/registry-server/_files/test-package-5",
                    "raw": "http://github.com/cadorn/pinf/raw/{rev}/packages/cli/tests/registry-server/_files/test-package-5/{path}",
                    "download": {
                      "type": "zip",
                      "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
                    }
                  }
                ],
                "version": "0.0.0rev-" + rev
              }
            }
          }
        }
    );


    file = filesPath.join("test-package-1");
    OS.command("cd " + file.valueOf() + "; git tag v0.2.1rc1");

    tusk.command("pinf --db " + tmpDBPath + " announce-release " + file.valueOf());

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/test-package-1/").decodeToString()),
        {
          "name": "test-package-1",
          "versions": {
            "0": {
              "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-1/",
              "name": "test-package-1",
              "version": "0.2.0"
            },
            "0.2.1rc": {
              "uid": "http://127.0.0.1:8080/test@pinf.org/public/test-package-1/",
              "name": "test-package-1",
              "version": "0.2.1rc1"
            }
          }
        }
    );

    resetFiles({"skipUIDRemoval": true});
}


exports.testProgram = function() {

    var file;

    file = filesPath.join("test-package-6");

    tusk.command("pinf --db " + tmpDBPath + " register-package test@pinf.org/public " + file.valueOf());
    tusk.command("pinf --db " + tmpDBPath + " announce-release --branch master " + file.valueOf());

    file = filesPath.join("test-program-1");

    tusk.command("pinf --db " + tmpDBPath + " register-package test@pinf.org/public " + file.valueOf());
    tusk.command("pinf --db " + tmpDBPath + " announce-release --branch master " + file.valueOf());


    // program tests reside in external file to allow isolated running once
    // test ENV is setup by exports.testBasicRegistration()
    require("test").run(require("./lifecycle-program"));
}



function resetFiles(options) {
    
    options = options || {};

    var file,
        descriptor;

    // delete 'uid' property from test package descriptors
    if(!options.skipUIDRemoval) {
        [
            "test-package-1",
            "test-package-2",
            "test-package-5",
            "test-package-6",
            "test-program-1"
        ].forEach(function(name) {
            file = filesPath.join(name, "package.json");
            var descriptor = JSON.decode(file.read());
            delete descriptor.uid;
            file.write(JSON.encode(descriptor, null, '    '));
        });
    }
    
    // delete .git repositores for test packages
    [
        "test-package-1",
        "test-package-2"
    ].forEach(function(name) {
        file = filesPath.join(name, ".git");
        OS.command("rm -Rf " + file.valueOf());
    });
}

function initFiles() {
    
    var file;
    
    // initial setup of .git repositories for test packages

    file = filesPath.join("test-package-1");
    OS.command("cd " + file.valueOf() + "; git init; git add . ; git commit -m 'base' ; git tag v0.1.0");

    file = filesPath.join("test-package-2");
    OS.command("cd " + file.valueOf() + "; git init; git add . ; git commit -m 'base' ; git tag v0.1.0");
}


if (require.main == module.id)
    require("os").exit(require("test").run(exports));
