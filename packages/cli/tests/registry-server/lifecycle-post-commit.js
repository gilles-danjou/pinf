
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var ASSERT = require("assert");
var OS = require("os");
var TUSK = require("narwhal/tusk/tusk");
var JSON = require("json");
var FILE = require("file");
var HTTP_CLIENT = require("http-client");
var HTTP = require("http");
var GIT = require("git", "github.com/cadorn/util/raw/master/lib-js");


var filesPath = FILE.Path(module.path).dirname().join("_files");


// setup

var tusk = TUSK.getActive() || TUSK.Tusk().activate(),
    seaPath = tusk.getSea().getPath();

var tmpDBPath = seaPath.join("build", "cli", "test", "db");



exports.testPostCommit = function() {

    var rev = GIT.Git(module.path).getLatestRevisionForBranch("master");

    var payload = {
        "repository": {
            "url": "http://github.com/cadorn/pinf"
        },
        "after": rev,
        "ref": "refs/heads/master",
        "commits": [
            {
                "modified": [
                    "packages/cli/tests/registry-server/_files/test-package-5/package.json"
                ]
            }
        ]
    }

    var data = "payload=" + escape(JSON.encode(payload));
    var response = HTTP_CLIENT.HttpClient({
        "method": "POST",
        "url": "http://127.0.0.1:8080/@webhooks/post-commit/github.com",
        "headers": {
            "Content-Length": data.length,
            "Content-Type": "application/json"
        },
        "body": [
            data
        ]
    }).connect();
    
    var body = [];
    response.body.forEach(function(chunk) {
        body.push(chunk.decodeToString());
    });
    
    ASSERT.equal(body.join(""), "OK");
    
    
    // NOTE: The assertion below will likely fail due to a timing issue as the update process is handled via a
    //       queued event on appengine which does not execute right away
    // TODO: Wait for a bit until we request the catalog

    ASSERT.deepEqual(
        JSON.decode(HTTP.read("http://127.0.0.1:8080/test@pinf.org/public/test-package-5/").decodeToString()),
        {
          "name": "test-package-5",
          "versions": {
            "0.1.3rc": {
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
              "version": "0.1.3rc1"
            }
          },
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
}


if (require.main == module.id)
    require("os").exit(require("test").run(exports));
