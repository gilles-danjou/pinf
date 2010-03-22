

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var PACKAGES = require("packages");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");
var BUILDER = require("./builder/platform");
var PINF = require("./pinf");
var OS = require("os");


var Platform = exports.Platform = function(path, locator) {
    if (!(this instanceof exports.Platform))
        return new exports.Platform(path, locator);
    this.path = path;
    this.locator = locator;
}

Platform.prototype = PACKAGE.Package();


Platform.prototype.init = function(locator, name, options) {
    if(this.exists()) {
        throw new Error("Platform already exists at: " + this.getPath());
    }
    this.locator = locator;
    var self = this;
    name = name || locator.getTopLevelId();
    options = options || {};
    options.targetPackageName = name;
    try {
        var pkg = PINF.getPackageForLocator(locator);
        if(!pkg) {
            throw new Error("Could not locate platform package");
        }

        var implUri = "http://registry.pinf.org/cadorn.org/github/pinf/@meta/platform/package/0.1.0",
            impl = pkg.getDescriptor().getImplementsForUri(implUri);
        if(!impl) {
            throw new Error("Referenced platform package '"+pkg.getPath()+"' does not implement '"+implUri+"'.");
        }

        var builder = BUILDER.PlatformBuilder();

        builder.setSourcePackage(pkg);
        builder.setTargetPackage(this);

        builder.triggerBuild(options);

    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}

Platform.prototype.update = function() {

    var file = this.getPath().join("package.json");
    if(!file.exists()) {
        throw new Error("No platform descriptor found at: " + file);
    }

    var spec = JSON.decode(file.read().toString());
    if(!spec || !spec.name || !spec.using || !spec.using.platform) {
        throw new Error("Malformed platform descriptor at: " + file);
    }

    try {

        // TODO: We need to compile the platform in a new directory and
        //       only replace the existing one once we know the new one works.        
        this.destroy();
        this.init(LOCATOR.PackageLocator(spec.using.platform), spec.name, {
            "forceBuild": true
        });

    } catch(e) {
        // The init failed which means we now have a broken or rather missing platform.
        // To allow re-running of "pinf update-platform <ID>" we keep the package.json file
        file.dirname().mkdirs();
        file.write(JSON.encode(spec, null, "    "));
        throw e;
    }
}

Platform.prototype.destroy = function() {
    // NOTE: This removes all local traces of the platform.
    OS.command("rm -Rf " + this.getPath());
}

Platform.prototype.isAliased = function() {
    return (this.getName().split("/").length==1);
}

Platform.prototype.getPackageStore = function() {
    return PINF.getPackageStore();
}

Platform.prototype.getControlPackage = function() {
    var pkg = PINF.getPackageForLocator(this.getDescriptor().getUsingLocatorForName("platform"));
    PACKAGES.registerUsingPackage(pkg.getLocator().getSpec(true), pkg.getPath().valueOf());
    return pkg;
}

/**
 * @deprecated
 */
Platform.prototype.expandMacros = function(context, contents) {
    return this.callService(context, "expandMacros", [contents]);
}

Platform.prototype.getVariations = function(context) {
    return this.callService(context, "getVariations", []);
}


Platform.prototype.callService = function(context, name, args) {
    var contract_uri = "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/@meta/platform/services/0.1.0",
        pkg = this.getControlPackage(),
        info = pkg.getImplementsForUri(contract_uri);
    if(!info) {
        return false;
    }
    if(!info.module) {
        throw new Error("Implements definition for uri '"+contract_uri+"' does not specify 'module' property.");
    }

    var macros = require(info.module, pkg.getTopLevelId());
    if(!macros[name]) {
        return false;
    }

    return macros[name].apply(null, [
        {
            "platform": this,
            "builder": context.pkg.getBuilder(),
            "targetPackage": context.targetPackage,
            "testPackage": context.testPackage
        }
    ].concat(args));
}
