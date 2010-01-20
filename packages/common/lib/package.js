

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

Package.prototype.getLocator = function() {
    return this.locator;
}

Package.prototype.getUid = function() {
    return this.getDescriptor().getUid();
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
        if(locator.isCatalog()) {
            // the module is located in an external package.
            pkg = options.packageStore.get(locator);
        }
        // we need to add the package as a using package to our
        // current PACKAGES to be able to enter it and load a module from it.
        // TODO: Refactor to require(<module>, locator) once require supports arbitrary locators
        PACKAGES.registerUsingPackage(options.packageStore.getPackagesPath(), FILE.Path(pkg.getTopLevelId()));
        return require(locator.getModule(), pkg.getTopLevelId());
    }
    return false;
}

