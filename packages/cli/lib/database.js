
var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var JSON_STORE = require("json-store", "util");


var Database = exports.Database = function(path) {
    if (!(this instanceof exports.Database))
        return new exports.Database(path);
    
    this.path = path;
    
    if(!this.exists()) {
        this.path.mkdirs();
    }
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

Database.prototype.getRegistryUriForNamespace = function(namespace) {
    var registry = this.getConfig("namespaces").get([namespace, "registry"]);
    if(!registry) {
        throw new Error("Namespace not found in local registry");
    }
    var registryInfo = this.getConfig("registries").get([registry]);
    return URI.parse(registryInfo.server + namespace + "/");
}
