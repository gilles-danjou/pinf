
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };



var database;

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

exports.getPackageForLocator = function(locator) {
    return exports.getDatabase().getPackage(locator);
}

exports.getPackageStore = function() {
    return exports.getDatabase().getPackageStore();
}

exports.getDefaultPlatform = function() {
    // default to narwhal for now
    var name = "narwhal",
        platform = exports.getPlatformForName(name);
    if(!platform.exists()) {
        throw new Error("Default platform not installed: " + name);
    }
    return platform;
}
