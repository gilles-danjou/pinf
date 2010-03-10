

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var URI = require("uri");
var FILE = require("file");
var PLATFORM = require("./platform");
var LOCATOR = require("./package/locator");



var Platforms = exports.Platforms = function(path) {
    if (!(this instanceof exports.Platforms))
        return new exports.Platforms(path);

    this.path = path;
}

Platforms.prototype.getPath = function() {
    return this.path;
}



/**
 * Supported selectors:
 *   * string ID of path to platform (this.getPath().join(<selector>))
 *   * LOCATOR.PackageLocator (this.getPath().join(<selector>.getFsPath()))
 */
Platforms.prototype.getForSelector = function(selector) {
    var id,
        locator;
    if(selector instanceof LOCATOR.PackageLocator || (selector.__class__ && selector.__class__=="PackageLocator")) {
        id = selector.getFsPath().valueOf();
        locator = selector;
    } else
    if(typeof selector == "string") {
        id = selector;
        // TODO: Construct a locator for the named platform
    } else {
        throw new PlatformsError("Selector type not supported: " + selector);
    }
    return PLATFORM.Platform(this.path.join(id), locator);
}


Platforms.prototype.getDefault = function() {
    // TODO: Make default platform configurable
    // default to narwhal-rhino for now
    var name = "registry.pinf.org/cadorn.org/github/platforms/packages/narwhal/packages/rhino/master",
        platform = this.getForSelector(name);
    if(!platform.exists()) {
        var locator = LOCATOR.PackageLocator({
            "catalog": "http://registry.pinf.org/cadorn.org/github/platforms/packages/narwhal/packages/catalog.json",
            "name": "rhino",
            "revision": "master"
        });
        // Install default platform
        platform = this.getForSelector(locator);
        platform.init(locator);
    }
    return platform;
}


Platforms.prototype.forEach = function(callback, subPath) {
    var path = this.path,
        self = this;
    if(subPath) {
        path = path.join(subPath);
    }
    var found = false,
        dirs = [];
    path.listPaths().forEach(function(item) {
        if(found) return;
        if(item.basename()=="package.json") {
            found = true;
            callback(PLATFORM.Platform(item.dirname()));
        } else
        if(item.isDirectory()) {
            dirs.push(item.basename());
        }
    });
    if(!found) {
        dirs.forEach(function(dir) {
            self.forEach(callback, (subPath)?subPath.join(dir):dir);
        });
    }
}



var PlatformsError = exports.PlatformsError = function(message) {
    this.name = "PlatformsError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PlatformsError.prototype = new Error();

