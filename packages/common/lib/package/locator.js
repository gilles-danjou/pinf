

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
    } else
    if(this.spec.location && this.spec.name) {
        throw new Error("The 'name' property has no meaning when using 'location'!");
    } else
    if(this.spec.location && this.spec.revision) {
        throw new Error("The 'revision' property has no meaning when using 'location'!");
    }
}

PackageLocator.prototype.getSpec = function() {
    return this.spec;
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

PackageLocator.prototype.setRevision = function(revision) {
    this.spec.revision = revision;
}

PackageLocator.prototype.getRevision = function() {
    return this.spec.revision || false;
}

PackageLocator.prototype.getModule = function() {
    return this.spec.module || false;
}

PackageLocator.prototype.setModule = function(module) {
    this.spec.module  = module;
}

PackageLocator.prototype.getName = function() {
    if(!this.spec.name) throw new Error("No 'name' property");
    return this.spec.name;
}

PackageLocator.prototype.getFsPath = function() {
    return PACKAGES.normalizePackageDescriptor(this.spec);
}

PackageLocator.prototype.getTopLevelId = function() {
    var id = this.getFsPath().split("/");

    // location locators do not take revision or version into account    
    if(this.isDirect()) {
        return id.join("/");
    }

    // normalize ID by removing revision if set in spec to allow
    // more fine-grained revision/version selection below
    if(this.getRevision()) {
        id.pop();
    }

    if(this.hasPinnedVersion()) {
        id.push(this.getPinnedVersion())
    } else
    if(this.getRevision()) {
        id.push(this.getRevision());
    }
    return id.join("/");
}

PackageLocator.prototype.pinAtVersion = function(version) {
    this.version = version;
}

PackageLocator.prototype.hasPinnedVersion = function() {
    return (!!this.version);
}

PackageLocator.prototype.getPinnedVersion = function() {
    return this.version || false;
}
