
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

exports.getPackageForLocator = function(locator) {
    return exports.getDatabase().getPackage(locator);
}

exports.getPackageStore = function() {
    return exports.getDatabase().getPackageStore();
}

exports.getPlatformForSelector = function(selector) {
    return exports.getDatabase().getPlatformForSelector(selector);
}

exports.getPlatformForName = function(name) {
    // TODO: Deprecate in favor of exports.getPlatformForSelector()
    return exports.getDatabase().getPlatformForSelector(name);
}

exports.getPlatformForLocator = function(locator) {
    // TODO: Deprecate in favor of exports.getPlatformForSelector()
    return exports.getDatabase().getPlatformForSelector(locator);
}

exports.getDefaultPlatform = function() {
    return exports.getDatabase().getPlatforms().getDefault();
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
