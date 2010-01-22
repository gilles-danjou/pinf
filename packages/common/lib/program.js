

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var OS = require("os");
var JSON_STORE = require("json-store", "util");
var PACKAGE = require("./package");


var Program = exports.Program = function(path, locator) {
    if (!(this instanceof exports.Program))
        return new exports.Program(path, locator);
        
    this.path = path;
    this.locator = locator;
    
    if(!this.path.join("program.json").exists()) {
        throw new Error("Program descriptor file not found at: " + this.path.join("program.json"));
    }
    
    this.spec = JSON_STORE.JsonStore(this.path.join("program.json"));
}

Program.prototype = PACKAGE.Package();


Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


Program.prototype.clean = function(options) {
    if(options.path.exists()) {
        // sanity check before we delete the previous build
        if(options.path.join("package.json").exists() && options.path.join("using").exists()) {
            OS.command("rm -Rf " + options.path.valueOf());
        }
    }
}

Program.prototype.build = function(options) {
    var self = this;

    options = options || {};
    if(!options.path) {
        options.path = this.getPath().join(".build");
    }

    this.clean(options);

    var descriptor = this.getDescriptor(),
        buildPath = options.path,
        path;
        
    // link package.json file
    path = buildPath.join("package.json");
    path.dirname().mkdirs();
    this.getPath().join("package.json").symlink(path);

    // link all using packages to desired versions
    var usingLocatorRewriteInfo = [];
    descriptor.traverseEveryUsing(function(pkg, name, locator, stacks) {

        var key = ["config", "using"].concat(stacks.names).concat([name, "$"]);
        if(!self.spec.has(key)) {
            // no version set - use base revision from locator
        } else {
            // use version we have set
            locator.pinAtVersion(self.spec.get(key).version);
        }

        var usingPackage = self.packageStore.get(locator);
        // linked packages do not contain 'version' properties
        if(usingPackage.getVersion()) {
            locator.pinAtVersion(usingPackage.getVersion());
        }

        path = buildPath.join("using", usingPackage.getTopLevelId());
        path.dirname().mkdirs();
        
        
        // if package has a version we need to copy it, otherwise we can link it (as it is likely a sources overlay)
        if(usingPackage.getVersion()) {
            FILE.copyTree(usingPackage.getPath(), path);
            // since we copied it to a specific version we need to update all using package locators
            // to include the exact version
            usingLocatorRewriteInfo.push({
                "id": pkg.getTopLevelId(),
                "name": name,
                "version": usingPackage.getVersion()
            });
        } else {
            usingPackage.getPath().symlink(path);
        }

/*
TODO: Move this to Program.prototype.freeze()
        self.spec.set(key, {
            "uid": usingPackage.getUid(),
            "version": locator.getPinnedVersion()
        });
*/
        return locator;
    }, {
        "packageStore": this.packageStore,
        "package": this
    });
    
    usingLocatorRewriteInfo.forEach(function(info) {
        if(info.id==self.getTopLevelId()) {
            path = self.getPath();
        } else {
            path = buildPath.join("using", info.id);
        }
        JSON_STORE.JsonStore(path.join("package.json")).set(["using", info.name, "revision"], info.version);
    });


    var builder = this.getBuilder({
        "packageStore": this.packageStore
    });

    builder.triggerBuild(this, options);
}

