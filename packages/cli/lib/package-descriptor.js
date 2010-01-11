

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var JSON = require("json");
var URI = require("uri");
var VALIDATOR = require("validator", "util");


var PackageDescriptor = exports.PackageDescriptor = function(path) {
    if (!(this instanceof exports.PackageDescriptor))
        return new exports.PackageDescriptor(path);
        
    this.path = path;

    if(!path.exists()) {
        throw new Error("No package descriptor found at: " + path);
    }
    this.descriptor = JSON.decode(path.read());
    if(!this.descriptor) {
        throw new Error("Error parsing package descriptor at: " + path);
    }
    if(!this.descriptor.name) {
        throw new Error("No 'name' property in package descriptor at: " + path);
    }
}

PackageDescriptor.prototype.save = function() {
    this.path.write(JSON.encode(this.descriptor, null, "    "));
}

PackageDescriptor.prototype.getName = function() {
    return this.descriptor.name;
}

PackageDescriptor.prototype.hasUid = function() {
    if(!this.descriptor.uid) return false;
    return true;
}

PackageDescriptor.prototype.getUid = function() {
    if(!this.descriptor.uid) {
        throw new Error("No 'uid' property in package descriptor at: " + this.path);
    }
    var uri = VALIDATOR.validate("url", this.descriptor.uid, {
        "require": [
            ["path", {"trailingSlash": true}]
        ],
        "return": "uri"
    });
    if(uri.directories[uri.directories.length-1]!=this.descriptor.name) {
        throw new Error("The 'uid' property does not have the 'name' property at the end of the URI in package descriptor at: " + this.path);
    }
    return this.descriptor.uid;
}

PackageDescriptor.prototype.setUid = function(uid) {
    // insert 'uid' at the top of the package descriptor
    this.descriptor = UTIL.complete({
        "uid": uid
    }, this.descriptor);
    this.save();
}

PackageDescriptor.prototype.getRegistryUri = function() {
    // trim the 'name' part from the uid
    var parts = this.getUid().split("/");
    return parts.slice(0, parts.length-2).join("/") + "/";
}


