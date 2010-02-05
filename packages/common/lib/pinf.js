
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var FILE = require("file");
var URI = require("uri");
var SYSTEM = require("system");
var DATABASE = require("./database");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");


var database;


exports.getDefaultDatabase = function() {
    return DATABASE.Database(FILE.Path(SYSTEM.env["HOME"]).join("pinf"));
}

exports.setDatabase = function(obj) {
    database = obj;
}

exports.getDatabase = function() {
    if(!database) {
        throw new Error("Database not set");
    }
    return database;
}

exports.getCredentials = function(uri, environment) {
    return exports.getDatabase().getCredentials(uri, environment);
}

exports.getWorkspaceForSelector = function(selector) {
    return exports.getDatabase().getWorkspaceForSelector(selector);
}

exports.getPlatformForName = function(name) {
    return exports.getDatabase().getPlatformForName(name);
}

exports.getPlatformForLocator = function(locator) {
    return exports.getDatabase().getPlatformForLocator(locator);
}

exports.getPackageForLocator = function(locator) {
    return exports.getDatabase().getPackage(locator);
}

exports.getPackageStore = function() {
    return exports.getDatabase().getPackageStore();
}

exports.getDefaultPlatform = function() {
    // default to narwhal-rhino for now
    var name = "registry.pinf.org/cadorn.org/github/platforms/packages/narwhal/packages/rhino/master",
        platform = exports.getPlatformForName(name);
    if(!platform.exists()) {
        var locator = LOCATOR.PackageLocator({
            "catalog": "http://registry.pinf.org/cadorn.org/github/platforms/packages/narwhal/packages/catalog.json",
            "name": "rhino",
            "revision": "master"
        });
        // Install default platform
        platform = exports.getPlatformForLocator(locator);
        platform.init(locator);
    }
    return platform;
}

exports.mapSources = function() {
    return exports.getDatabase().mapSources();
}

exports.locatorForDirectory = function(directory) {
    var pkg = PACKAGE.Package(directory);
    if(!pkg.exists()) {
        throw new Error("No package at: " + directory);
    }
    if(pkg.hasUid()) {
        var uri = URI.parse(pkg.getUid()),
            name = uri.directories.pop(),
            catalog = uri.scheme + ":" + uri.authorityRoot + uri.authority + "/" + uri.directories.join("/") + "/catalog.json";
        return LOCATOR.PackageLocator({
            "catalog": catalog,
            "name": name
        });
    } else {
        return LOCATOR.PackageLocator({
            "location": "file://" + pkg.getPath().valueOf()
        });
    }
}
