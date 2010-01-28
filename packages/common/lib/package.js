

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var FILE = require("file");
var DESCRIPTOR = require("./package/descriptor");
var LOCATOR = require("./package/locator");
var BUILDER = require("./builder");
var PUBLISHER = require("./publisher");
var PACKAGES = require("packages");


var Package = exports.Package = function(path, locator) {
    if (!(this instanceof exports.Package))
        return new exports.Package(path, locator);
    this.path = path;
    this.locator = locator;
}

Package.prototype.getPath = function() {
    return this.path;
}

Package.prototype.exists = function() {
    return this.path.exists();
}

Package.prototype.getLocator = function() {
    return this.locator;
}

Package.prototype.hasUid = function() {
    return this.getDescriptor().hasUid();
}

Package.prototype.getUid = function() {
    return this.getDescriptor().getUid();
}

Package.prototype.getName = function() {
    return this.getDescriptor().getName();
}

Package.prototype.getTopLevelId = function() {
    if(this.locator) {
        return this.locator.getTopLevelId();
    } else {
        var uri = URI.parse(this.getUid()),
            version = this.getVersion();
        if(version) {
            return uri.domain + uri.path + this.getVersion();
        } else {
            return uri.domain + "/" + uri.directories.join("/");
        }
    }
}

Package.prototype.getVersion = function() {
    return this.getDescriptor().getVersion();
}

Package.prototype.getDescriptor = function() {
    if(!this.descriptor) {
        this.descriptor = DESCRIPTOR.PackageDescriptor(this.path.join("package.json"));
    }
    return this.descriptor;
}

Package.prototype.getBuilder = function(options) {
    var module = this.getModuleForPinfLocatorProperty(options, "builder");
    if(module) {
        return module.Builder(this, options);
    } else {
        return BUILDER.Builder(this, options);
    }
}

Package.prototype.getPublisher = function(options) {
    var module = this.getModuleForPinfLocatorProperty(options, "publisher");
    if(module) {
        return module.Publisher(this, options);
    } else {
        return PUBLISHER.Publisher(this, options);
    }
}

Package.prototype.getModuleForPinfLocatorProperty = function(options, propertyName) {
    if(!options.packageStore) {
        throw new Error("'options.packageStore' not provided");
    }
    var descriptor = this.getDescriptor(),
        pinf = descriptor.getPinfSpec();

    if(pinf[propertyName]) {
        var locator = LOCATOR.PackageLocator(pinf[propertyName]),
            pkg = this;
        if(!locator.getModule()) {
            throw new Error("'pinf."+propertyName+"' locator does not specify a 'module' property");
        }
        if(locator.isCatalog() || locator.isDirect()) {
            // the module is located in an external package.
            pkg = options.packageStore.get(locator);
        } else {
            // the module is in our own package
            var newLocator = this.getLocator();
            newLocator.setModule(locator.getModule());
            locator = newLocator;
        }

        PACKAGES.registerUsingPackage(locator.getSpec(true), pkg.getPath().valueOf());

        // collect all dependencies (recursively) for package
        var mappings = options.packageStore.deepMappingsForPackage(pkg);
        // register dependency mappings in preparation for loading
        if(mappings && mappings.length>0) {
            mappings.forEach(function(mapping) {
                PACKAGES.registerUsingPackage(mapping[0], mapping[1]);
            });
        }

        // load actual module now that package and dependencies are registered
        return require(locator.getModule(), pkg.getTopLevelId());
    }
    return false;
}
