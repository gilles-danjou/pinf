

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
var ARGS = require("args");
var TERM = require("term");


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

//    if(!this.path.join("package.json").exists()) {
//        throw new Error("Program's package descriptor file not found at: " + this.path.join("package.json"));
//    }

//    this.spec = JSON_STORE.JsonStore(this.path.join("program.json"));

//    this.localSpec = JSON_STORE.JsonStore(this.path.join("program.local.json"));
    
//    this.packageDescriptor = DESCRIPTOR.PackageDescriptor(this.path.join("package.json"));
}


Program.prototype.getSystemPackageLocatorForName = function(names) {
    if(!UTIL.isArrayLike(names)) {
        names = [names];
    }
    names = names.concat(["@", "locator"]);
    var key = ["packages", "system"].concat(names);

    var spec = JSON_STORE.JsonStore(this.getPath().join("program.json"));

    if(!spec.has(key)) {
        throw new Error("No package declared at: " + key);
    }
    
    return LOCATOR.PackageLocator(spec.get(key));
}


Program.prototype.expandMacros = function(builder, contents) {

    var implUri = "http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0",
        impl = this.getDescriptor().getImplementsForUri(implUri);
    if(!impl) {
        return contents;
    }

    var locator = LOCATOR.PackageLocator(impl["builders"][builder.getTarget()]),
        pkg;

    if(!locator.getModule()) {
        throw new Error("'builders."+builder.getTarget()+"' locator does not specify a 'module' property");
    }
    if(locator.isCatalog() || locator.isDirect()) {
        // the module is located in an external package
    } else {
        // the module is in our own package
        var newLocator = this.getLocator().clone();
        newLocator.setModule(locator.getModule());
        locator = newLocator;
    }
    pkg = PINF.getPackageForLocator(locator);

    pkg.makeCallable();

    // load actual module now that package and dependencies are registered

    var macroBuilder = require(locator.getModule(), pkg.getTopLevelId()).ProgramBuilder();
    macroBuilder.setTarget(builder.getTarget());
    macroBuilder.setSourcePackage(builder.sourcePackage);
    macroBuilder.setTargetPackage(builder.targetPackage);
    return macroBuilder.expandMacros(this, contents);
}


/**
 * deprecated
 */
Program.prototype.getName = function() {
    return this.packageDescriptor.getName();
}


/**
 * deprecated
 */
Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


/**
 * deprecated
 */
Program.prototype.clean = function() {
    var buildPath = this.getBuildPath();
    if(buildPath.exists()) {
        // basic sanity check before we delete the previous build
        if(buildPath.join("raw", "package.json").exists()) {
            OS.command("rm -Rf " + buildPath.valueOf());
        }
    }
}


/**
 * deprecated
 */
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

    return this.getPath();
}


/**
 * deprecated
 */
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


Program.prototype.launch = function(launchOptions) {
    
    // pull out all options until the package is specified
    // TODO: The ARGS parser should have an option to stop parsing at a given argument
    var args = {
        "launcher": [],
        "program": false
    };
    launchOptions.args.forEach(function(arg) {
        if(arg.substr(0,1)=="-") {
            if(args.program!==false) {
                args.program.push(arg);
            } else {
                args.launcher.push(arg);
            }
        } else {
            if(args.program!==false) {
                args.program.push(arg);
            } else {
                args.launcher.push(arg);
                args.program = [];
            }
        }
    });

    var parser = new ARGS.Parser();
    parser.option('--bin').set().help("The command to launch");
    var options = parser.parse(args.launcher);

    if(options.bin) {
        
        var binPath = this.getPath().join("bin", options.bin);
        if(!binPath.exists()) {
            throw new Error("Command file not found at: " + binPath);
        }
        
        var command = binPath.valueOf() + ((args.program && args.program.length>0)?" "+args.program.join(" "):"");

        TERM.stream.print("\0cyan(Running: " + command + "\0)");

        OS.system(command);

    } else {
        throw new Error("Default launchers not supported yet! Specify --bin");
    }

/*    
    var launcher = this.getLauncher({
        "packageStore": this.packageStore
    });

    launcher.triggerLaunch(this, options);
*/    
}
