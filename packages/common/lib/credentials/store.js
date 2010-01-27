
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON_STORE = require("json-store", "util");


var CredentialsStore = exports.CredentialsStore = function(path) {
    if (!(this instanceof exports.CredentialsStore))
        return new exports.CredentialsStore(path);

    this.path = path;

    this.store = new JSON_STORE.JsonStore(this.path);
    if(!this.store.exists()) {
        this.store.init();
    }
}

CredentialsStore.prototype.getCredentials = function(uri, environment) {
    environment = environment || "default";
    var keys = UTIL.keys(this.store.get([environment]));
    keys = keys.filter(function(key) {
        return (key.length <= uri.length);
    });
    var parts = uri.split("/"),
        key;
    // match the uri against credential URIs by removing one part at a time
    while(parts.length>1) {
        key = parts.join("/") + "/";
        if(UTIL.has(keys, key)) {
            break;
        }
        key = false;
        parts.pop();
    }
    if(!key) {
        throw new Error("No credentials found for '" + uri + "' in environment: " + environment);
    }
    return this.store.get([environment, key]);
}
