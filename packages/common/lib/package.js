

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var FILE = require("file");
var DESCRIPTOR = require("./package/descriptor");
var LOCATOR = require("./package/locator");
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

Package.prototype.getBuildPath = function() {
    return require("./pinf").getDatabase().getBuildPathForPackage(this);
}

Package.prototype.getDataPath = function() {
    return require("./pinf").getDatabase().getDataPathForPackage(this);
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

Package.prototype.getImplementsForUri = function(uri) {
    return this.getDescriptor().getImplementsForUri(uri);
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
    var info = this.getInfoForPinfLocatorProperty("builder");
    if(info) {
        return info.module.Builder(info.pkg, options);
    } else {
        return require("./builder").Builder(this, options);
    }
}

Package.prototype.getPublisher = function(options) {
    var info = this.getInfoForPinfLocatorProperty("publisher");
    if(info) {
        return info.module.Publisher(info.pkg, options);
    } else {
        return require("./publisher").Publisher(this, options);
    }
}

Package.prototype.getTester = function() {
    var info = this.getInfoForPinfLocatorProperty("tester");
    if(info) {
        return info.module.Tester(info.pkg);
    } else {
        return require("./tester").Tester(this);
    }
}

Package.prototype.getLauncher = function() {
    var info = this.getInfoForPinfLocatorProperty("launcher");
    if(info) {
        return info.module.Launcher(info.pkg);
    } else {
        return require("./launcher").Launcher(this);
    }
}

/**
 * @deprecated
 */
Package.prototype.getInfoForPinfLocatorProperty = function(propertyName) {
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
            pkg = require("./pinf").getPackageForLocator(locator);
        } else {
            // the module is in our own package
            var newLocator = this.getLocator().clone();
            newLocator.setModule(locator.getModule());
            locator = newLocator;
        }

        // TODO: If pkg has a program.json file we need to build the package first as the
        //       module being required may need the built program

        pkg.makeCallable();

        // load actual module now that package and dependencies are registered
        return {
            "pkg": this,//require("./pinf").getPackageForLocator(locator),
            "module": require(locator.getModule(), pkg.getTopLevelId())
        }
    }
    return false;
}


Package.prototype.makeCallable = function() {

    PACKAGES.registerUsingPackage(this.getLocator().getSpec(true), this.getPath().valueOf());

    // collect all dependencies (recursively) for package
    var mappings = require("./pinf").getDatabase().getPackageStore().deepMappingsForPackage(this);

    // register dependency mappings in preparation for loading
    if(mappings && mappings.length>0) {
        mappings.forEach(function(mapping) {
            PACKAGES.registerUsingPackage(mapping[0], mapping[1]);
        });
    }
}
