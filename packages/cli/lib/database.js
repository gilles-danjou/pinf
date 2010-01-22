

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var JSON_STORE = require("json-store", "util");
var PACKAGE_DESCRIPTOR = require("package/descriptor", "common");
var PACKAGE_STORE = require("package/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var PROGRAM_STORE = require("program/store", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var PACKAGE_SOURCES = require("package/sources", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");


var Database = exports.Database = function(path) {
    if (!(this instanceof exports.Database))
        return new exports.Database(path);
    
    this.path = path;
    
    if(!this.exists()) {
        this.path.mkdirs();
    }
    
    this.packageStore = PACKAGE_STORE.PackageStore(this.path);
    this.packageStore.setSources(this.getSources());

    this.programStore = PROGRAM_STORE.ProgramStore(this.path);
    this.programStore.setPackageStore(this.packageStore);
}

Database.prototype.exists = function() {
    return this.path.exists();
}

Database.prototype.getConfig = function(path) {
    var file = this.path.join("config", path + ".json");
    var config = JSON_STORE.JsonStore(file);
    if(!config.exists()) {
        config.init();
    }
    return config;
}

Database.prototype.getSources = function() {
    var path = this.path.join("config", "sources.json");
    if(!path.exists()) {
        path.dirname().mkdirs();
        path.write("{}");
    }
    return PACKAGE_SOURCES.PackageSources(path);
}

Database.prototype.getRegistryUriForNamespace = function(namespace) {
    var registry = this.getConfig("namespaces").get([namespace, "registry"]);
    if(!registry) {
        throw new Error("Namespace not found in local registry");
    }
    var registryInfo = this.getConfig("registries").get([registry]);
    return URI.parse(registryInfo.server + namespace + "/");
}

Database.prototype.getRegistryUriForPackage = function(path) {
    var descriptor = PACKAGE_DESCRIPTOR.PackageDescriptor(path.join("package.json"));
    return URI.parse(descriptor.getRegistryUri());
}

Database.prototype.getPackage = function(locator) {
    return this.packageStore.get(locator);
}

Database.prototype.getProgram = function(locator) {
    return this.programStore.get(locator);
}

Database.prototype.getBuildPathForLocator = function(locator) {
    return this.path.join("builds", locator.getFsPath());
}

