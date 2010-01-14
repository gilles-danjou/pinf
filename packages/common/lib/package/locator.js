

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var FILE = require("file");
var PACKAGES = require("packages");


var PackageLocator = exports.PackageLocator = function(spec) {
    if (!(this instanceof exports.PackageLocator))
        return new exports.PackageLocator(spec);
        
    this.spec = spec;
    
    if(this.spec.catalog && this.spec.location) {
        throw new Error("Cannot specify 'catalog' and 'location' property. Pick one!");
    } else
    if(this.spec.catalog && !this.spec.name) {
        throw new Error("Missing [package] 'name' property for 'catalog' property.");
    }
}

PackageLocator.prototype.isCatalog = function() {
    return (this.spec.catalog && this.spec.name);
}

PackageLocator.prototype.isDirect = function() {
    return (!!this.spec.location);
}

PackageLocator.prototype.getUrl = function() {
    if(this.isCatalog()) {
        return this.spec.catalog;
    } else
    if(this.isDirect()) {
        return this.spec.location;
    }
    throw new Error("Invalid spec");
}

PackageLocator.prototype.getRevision = function() {
    return this.spec.revision || false;
}

PackageLocator.prototype.getName = function() {
    if(!this.spec.name) throw new Error("No 'name' property");
    return this.spec.name;
}

PackageLocator.prototype.getFsPath = function(basePath) {
    return PACKAGES.normalizePackageDescriptor(this.spec);
}
