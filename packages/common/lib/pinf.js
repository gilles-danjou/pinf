
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var FILE = require("file");
var URI = require("uri");
var SYSTEM = require("system");
var DATABASE = require("./database");
var UTIL = require("util");


var database;


exports.getDefaultDatabase = function() {
    if(UTIL.has(SYSTEM.env, "PINF_HOME")) {
        return DATABASE.Database(FILE.Path(SYSTEM.env["PINF_HOME"]));
    } else
    if(UTIL.has(SYSTEM.env, "HOME")) {
        return DATABASE.Database(FILE.Path(SYSTEM.env["HOME"]).join("pinf"));
    } else {
        throw new PinfError("Cannot determine default PINF database path as PINF_HOME and HOME environment variables are not set!");
    }
}

exports.setDatabase = function(obj) {
    database = obj;
    // keep a global memo of the pinf database path so it can be referenced from
    // pinf modules with different top-level IDs (as is teh case when pinf is present in
    // a program via different package versions)
    system.pinf = {
        "databasePath": database.getPath()
    }
}

exports.getDatabase = function() {
    if(!database) {
        if(system.pinf && system.pinf.databasePath) {
            database = DATABASE.Database(system.pinf.databasePath);
        } else {
            database = exports.getDefaultDatabase();
        }
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

exports.getPackagesPath = function() {
    return exports.getDatabase().getPackageStore().getPackagesPath();
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
    
    var LOCATOR = require("./package/locator");

    
    var pkg = require("./package").Package(directory);
    if(!pkg.exists()) {
        throw new PinfError("No package at: " + directory);
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


var PinfError = exports.PinfError = function(message) {
    this.name = "PinfError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PinfError.prototype = new Error();
