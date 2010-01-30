

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var DESCRIPTOR = require("./descriptor");
var JSON_STORE = require("json-store", "util");
var SEMVER = require("semver", "util");


var PackageSources = exports.PackageSources = function(path) {
    if (!(this instanceof exports.PackageSources))
        return new exports.PackageSources(path);
        
    this.path = path;
    this.spec = JSON_STORE.JsonStore(this.path);
}

PackageSources.prototype.getDescriptor = function(locator) {
    var info;
    if(locator.isCatalog()) {
        // check for exact revision mapping
        info = this.spec.get([locator.getUrl(), locator.getName(), locator.getRevision(), "@"]);    
        if(!info) {
            // check for semver with alpha suffix
            info = this.spec.get([locator.getUrl(), locator.getName(), SEMVER.getMajor(locator.getRevision(), true), "@"]);    
        }
        if(!info) {
            // check for semver with major version only
            info = this.spec.get([locator.getUrl(), locator.getName(), SEMVER.getMajor(locator.getRevision()), "@"]);    
        }
    } else
    if(locator.isDirect()) {
        info = this.spec.get([locator.getUrl(), "@"]);
    }
    if(!info) {
        return false;
    }
    if(!info.path) {
        throw new PackageSourcesError("Sources locator does not contain a 'path' property");
    }
    return DESCRIPTOR.PackageDescriptor(FILE.Path(info.path).join("package.json"));
}


var PackageSourcesError = exports.PackageSourcesError = function(message) {
    this.name = "PackageSourcesError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PackageSourcesError.prototype = new Error();

