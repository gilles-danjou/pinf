

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var OS = require("os");
var JSON = require("json");
var JSON_STORE = require("json-store", "util");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");
var DESCRIPTOR = require("./package/descriptor");
var PINF = require("./pinf");


var Program = exports.Program = function(path, locator) {
    if (!(this instanceof exports.Program))
        return new exports.Program(path, locator);

    if(path && locator) {
        this.construct(path, locator);
    }
}

Program.prototype = PACKAGE.Package();

Program.prototype.construct = function(path, locator) {
        
    this.path = path;
    this.locator = locator;
    
//    if(!this.path.join("program.json").exists()) {
//        throw new Error("Program descriptor file not found at: " + this.path.join("program.json"));
//    }

    if(!this.path.join("package.json").exists()) {
        throw new Error("Program's package descriptor file not found at: " + this.path.join("package.json"));
    }

    this.spec = JSON_STORE.JsonStore(this.path.join("program.json"));

    this.localSpec = JSON_STORE.JsonStore(this.path.join("program.local.json"));
    
    this.packageDescriptor = DESCRIPTOR.PackageDescriptor(this.path.join("package.json"));
}


Program.prototype.getName = function() {
    return this.packageDescriptor.getName();
}


Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


Program.prototype.clean = function() {
    var buildPath = this.getBuildPath();
    if(buildPath.exists()) {
        // basic sanity check before we delete the previous build
        if(buildPath.join("raw", "package.json").exists()) {
            OS.command("rm -Rf " + buildPath.valueOf());
        }
    }
}

Program.prototype.build = function(options) {
    var self = this;

    options = options || {};

    if(!options.skipClean) {
        this.clean();
    }

    var descriptor = this.getDescriptor(),
        buildPath = this.getBuildPath(),
        rawBuildPath = buildPath.join("raw"),
        path;

    // write package.json file (merged with package.local.json if avaiable)
    path = rawBuildPath.join("package.json");
    path.dirname().mkdirs();
    path.write(JSON.encode(descriptor.spec, null, "    "));

    var spec = this.spec;
    if(!options.remoteProgram && !options.remoteDependencies) {
        spec = this.localSpec;
        if(!spec.exists()) {
            spec.init();
        }
    } else
    if(options.remoteDependencies) {
        if(!this.spec.exists()) {
            this.spec.init();
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
        descriptor[type[1].iterator](function(parentPackage, name, locator, stacks, property) {
            if(!locator) {
                return;
            }

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
            
            // when traversing dependencies, using packages are traversed as well
            if(property!=type[1]["property"]) {
                return locator;
            }

//            if(type[0]=="system") {
//                path = rawBuildPath.join(type[1].directory, stacks.names.concat(name).join("."));
//            } else
//            if(type[0]=="using") {
//                path = rawBuildPath.join(type[1].directory, pkg.getTopLevelId());
                path = rawBuildPath.join("using", pkg.getTopLevelId());
//            }

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
                // since we copied it to a specific version we need to update all package locators
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
                path = rawBuildPath.join("package.json");
            } else {
                path = rawBuildPath.join(type[1].directory, info.id).join("package.json");
            }
            JSON_STORE.JsonStore(path).set([type[1].property, info.name, "revision"], info.revision);
        });
    });
    
    
    // link all packages with no UID property
    // these are packages that are managed as part of this package
    // if a UID is present the package will end up in /using/ based on dependency declarations
    var sourceBasePath = this.getPath().join("packages"),
        targetBasePath = rawBuildPath.join("packages");
    if(sourceBasePath.exists()) {
        targetBasePath.mkdirs();
        sourceBasePath.listPaths().forEach(function(item) {
            if(item.join("package.json").exists()) {
                if(!UTIL.has(JSON.decode(item.join("package.json").read().toString()), "uid")) {
                    item.symlink(targetBasePath.join(item.basename()));
                }
            }
        });
    };

print("build program: " + this.getPath());

    var builder = this.getBuilder();
//    options["skipWriteCommands"] = true;
    builder.triggerBuild(this, options);



    // build tester

    var spec = descriptor.getPinfSpec();
    if(spec && spec.tester) {
        var pkg = PINF.getPackageForLocator(LOCATOR.PackageLocator(spec.tester));
        options.testPackage = pkg;
        pkg.getBuilder().triggerBuild(PACKAGE.Package(rawBuildPath), options);
    }

    return buildPath;
}



Program.prototype.publish = function(options) {
    var self = this;

    options = options || {};
    if(!options.path) {
        options.path = this.getPath().join(".build");
    }
    
    var publisher = this.getPublisher({
        "packageStore": this.packageStore
    });

    publisher.triggerPublish(this, options);
    
    return options.path;
}


Program.prototype.launch = function(options) {
    
    var launcher = this.getLauncher({
        "packageStore": this.packageStore
    });

    launcher.triggerLaunch(this, options);
}