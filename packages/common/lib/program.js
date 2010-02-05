

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var OS = require("os");
var JSON_STORE = require("json-store", "util");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");
var DESCRIPTOR = require("./package/descriptor");


var Program = exports.Program = function(path, locator) {
    if (!(this instanceof exports.Program))
        return new exports.Program(path, locator);
        
    this.path = path;
    this.locator = locator;
    
    if(!this.path.join("program.json").exists()) {
        throw new Error("Program descriptor file not found at: " + this.path.join("program.json"));
    }

    if(!this.path.join("package.json").exists()) {
        throw new Error("Program's package descriptor file not found at: " + this.path.join("package.json"));
    }

    this.spec = JSON_STORE.JsonStore(this.path.join("program.json"));

    this.localSpec = JSON_STORE.JsonStore(this.path.join("program.local.json"));
    
    this.packageDescriptor = DESCRIPTOR.PackageDescriptor(this.path.join("package.json"));
}

Program.prototype = PACKAGE.Package();


Program.prototype.getName = function() {
    return this.packageDescriptor.getName();
}


Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


Program.prototype.clean = function(options) {
    if(options.path.exists()) {
        // basic sanity check before we delete the previous build
        if(options.path.join("raw", "package.json").exists()) {
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
    
    options.path = options.path.join(this.getName());

    this.clean(options);

    var descriptor = this.getDescriptor(),
        buildPath = options.path.join("raw"),
        path;
        
    // link package.json file
    path = buildPath.join("package.json");
    path.dirname().mkdirs();
    this.getPath().join("package.json").copy(path);

    var spec = this.spec;
    if(!options.remoteProgram && !options.remoteDependencies) {
        spec = this.localSpec;
        if(!spec.exists()) {
            spec.init();
        }
    }

    // link all system and using packages to desired versions
    options.uidLocators = {};
    UTIL.every({
        "system": {
            "iterator": "traverseEveryDependency",
            "directory": "packages",
            "property": "dependencies",
            "id": "getName"
        },
        "using": {
            "iterator": "traverseEveryUsing",
            "directory": "using",
            "property": "using",
            "id": "getTopLevelId"
        }
    }, function(type) {

        var locatorRewriteInfo = [];
        descriptor[type[1].iterator](function(parentPackage, name, locator, stacks) {
            var key = ["packages", type[0]].concat(stacks.names).concat([name, "@"]);
            if(options.remoteProgram) {
                if(!spec.has(key)) {
                    throw new Error("remote program.json is missing a locator for key: " + key.join(" -> "));
                }
                // overwite locator with the one from the program config
                locator = LOCATOR.PackageLocator(spec.get(key).locator);
            }

            if(options.remoteDependencies) {
                locator.setForceRemote(true);
            }

            var pkg = self.packageStore.get(locator);

            // linked packages do not contain 'version' properties
            if(pkg.getVersion()) {
                locator.pinAtVersion(pkg.getVersion());
            }

            path = buildPath.join(type[1].directory, pkg[type[1].id]());


            // update info in program.json file
            var info =  {};
            if(pkg.hasUid()) {
                info["uid"] = pkg.getUid();
                
                options.uidLocators[info["uid"]] = locator;
            }
            info["locator"] = locator.getSpec(true);
            spec.set(key, info);


            // if package has a version we need to copy it, otherwise we can link it (as it is likely a sources overlay)
            if(pkg.getVersion()) {
                if(!path.exists()) {
                    path.dirname().mkdirs();
                    FILE.copyTree(pkg.getPath(), path);
                }
                // since we copied it to a specific version we need to update all using package locators
                // to include the exact version
                locatorRewriteInfo.push({
                    "id": parentPackage[type[1].id](),
                    "name": name,
                    "revision": pkg.getVersion()
                });
            } else
            if(!path.exists()) {
                path.dirname().mkdirs();
                pkg.getPath().symlink(path);
            }

            return locator;
        }, {
            "packageStore": self.packageStore,
            "package": self
        });
    
        locatorRewriteInfo.forEach(function(info) {
            if(info.id==self[type[1].id]()) {
                path = buildPath.join("package.json");
            } else {
                path = buildPath.join(type[1].directory, info.id).join("package.json");
            }
            JSON_STORE.JsonStore(path).set([type[1].property, info.name, "revision"], info.revision);
        });
    });

    var builder = this.getBuilder({
        "packageStore": this.packageStore
    });

    builder.triggerBuild(this, options);
    
    return options.path;
}



Program.prototype.publish = function(options) {
    var self = this;

    options = options || {};
    if(!options.path) {
        options.path = this.getPath().join(".build");
    }
    
    options.path = options.path.join(this.getName());

    var publisher = this.getPublisher({
        "packageStore": this.packageStore
    });

    publisher.triggerPublish(this, options);
    
    return options.path;
}
