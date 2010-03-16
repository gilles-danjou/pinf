

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var FILE = require("file");
var PACKAGES = require("packages");


var PackageLocator = exports.PackageLocator = function(spec) {
    if (!(this instanceof exports.PackageLocator))
        return new exports.PackageLocator(spec);

    this.__class__ = "PackageLocator";

    this.spec = spec;
    
    if(this.spec.catalog && this.spec.location) {
        throw new PackageLocatorError("Cannot specify 'catalog' and 'location' property. Pick one!");
    } else
    if(this.spec.catalog && !this.spec.name) {
        throw new PackageLocatorError("Missing [package] 'name' property for 'catalog' property.");
    } else
    if(this.spec.location && this.spec.name) {
        throw new PackageLocatorError("The 'name' property has no meaning when using 'location'!");
    } else
    if(this.spec.location && this.spec.revision) {
        throw new PackageLocatorError("The 'revision' property has no meaning when using 'location'!");
    }
}

PackageLocator.prototype.clone = function() {
    return PackageLocator(UTIL.deepCopy(this.spec));
}

PackageLocator.prototype.getSpec = function(usePinnedVersion) {
    if(usePinnedVersion && this.hasPinnedVersion()) {
        var spec = UTIL.deepCopy(this.spec);
        spec.revision = this.getPinnedVersion();
        return spec;
    } else {
        return this.spec;
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
    throw new PackageLocatorError("Invalid spec");
}

PackageLocator.prototype.setRevision = function(revision) {
    this.spec.revision = revision;
}

PackageLocator.prototype.getRevision = function() {
    if(!this.isCatalog()) {
        // can only use revisions for catalog-based locators
        return false;
    }
    return this.spec.revision || false;
}

PackageLocator.prototype.getModule = function() {
    return this.spec.module || false;
}

PackageLocator.prototype.setModule = function(module) {
    this.spec.module  = module;
}

PackageLocator.prototype.getName = function() {
    if(!this.isCatalog()) {
        // can only use names for catalog-based locators
        return false;
    }
    if(!this.spec.name) throw new PackageLocatorError("No 'name' property");
    return this.spec.name;
}

PackageLocator.prototype.setForceRemote = function(forceRemote) {
    this.forceRemote = forceRemote;
}

PackageLocator.prototype.getForceRemote = function() {
    return this.forceRemote || false;
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
    if(!this.isCatalog()) {
        // can only pin versions for catalog-based locators
        return false;
    }
    return (!!this.version);
}

PackageLocator.prototype.getPinnedVersion = function() {
    if(!this.isCatalog()) {
        // can only pin versions for catalog-based locators
        return false;
    }
    return this.version || false;
}



var PackageLocatorError = exports.PackageLocatorError = function(message) {
    this.name = "PackageLocatorError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PackageLocatorError.prototype = new Error();

