

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var PACKAGES = require("packages");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");
var OS = require("os");


var Platform = exports.Platform = function(path) {
    if (!(this instanceof exports.Platform))
        return new exports.Platform(path);
    this.path = path;
}

Platform.prototype = PACKAGE.Package();


Platform.prototype.init = function(locator, name) {
    if(this.exists()) {
        throw new Error("Platform already exists at: " + this.getPath());
    }
    name = name || locator.getTopLevelId();
    try {
        var pkg = PINF.getPackageForLocator(locator);
        if(!pkg) {
            throw new Error("Could not locate platform package");
        }

        var path = this.getPath();
        path.mkdirs();

        var builder = pkg.getBuilder({
            "packageStore": this.getPackageStore()
        });

        // TODO: Deprecate 'path' property below
        builder.triggerBuild(pkg, {
            "path": path,
            "platformName": name
        });

        // write package.json file for platform
        var file = path.join("package.json");
        if(file.exists()) {
            throw new Error("Platform package may not install a package descriptor at: " + file);
        }
        file.write(JSON.encode({
            "name": name,
            "using": {
                "platform": locator.getSpec()
            }
        }, null, "    "));

        // write empty bin/activate.bash if it does not exist
        file = path.join("bin", "activate.bash");
        if(!file.exists()) {
            file.write("export PATH="+file.dirname()+":\"$PATH\"");
        }

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
        this.init(LOCATOR.PackageLocator(spec.using.platform), spec.name);

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

Platform.prototype.getPackageStore = function() {
    return PINF.getPackageStore();
}

Platform.prototype.getControlPackage = function() {
    var pkg = PINF.getPackageForLocator(this.getDescriptor().getUsingLocatorForName("platform"));
    PACKAGES.registerUsingPackage(pkg.getLocator().getSpec(true), pkg.getPath().valueOf());
    return pkg;
}

Platform.prototype.expandMacros = function(program, contents) {
    
    var uri = "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/@meta/platform/macros",
        pkg = this.getControlPackage(),
        info = pkg.getImplementsForUri(uri);
    if(!info) {
        return contents;
    }
    if(!info.module) {
        throw new Error("Implements definition for uri '"+uri+"' does not specify 'module' property.");
    }

    var macros = require(info.module, pkg.getTopLevelId());
    return macros.expandMacros(this, program, contents);
}

