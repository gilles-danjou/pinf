

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var LOCATOR = require("../package/locator");
var PINF = require("../pinf");
var TERM = require("term");
var JSON = require("json");
var UTIL = require("util");
var PACKAGE = require("../package");
var PACKAGE_BUILDER = require("../builder/package");
var JSON_STORE = require("json-store", "util");
var OS = require("os");
var FILE = require("file");
var URI = require("uri");
var SEMVER = require("semver", "util");


var ProgramBuilder = exports.ProgramBuilder = function() {
    if (!(this instanceof exports.ProgramBuilder))
        return new exports.ProgramBuilder();
}

ProgramBuilder.prototype.setSourcePackage = function(pkg) {
    this.sourcePackage = pkg;
}

ProgramBuilder.prototype.setTargetPackage = function(pkg) {
    this.targetPackage = pkg;
}

ProgramBuilder.prototype.setProgramPackage = function(pkg) {
    this.programPackage = pkg;
}

ProgramBuilder.prototype.setRawPackage = function(pkg) {
    this.rawPackage = pkg;
}

ProgramBuilder.prototype.setTarget = function(target) {
    this.target = target;
}

ProgramBuilder.prototype.setTargetOptions = function(options) {
    this.targetOptions = options;
}

ProgramBuilder.prototype.getTarget = function() {
    return this.target;
}

ProgramBuilder.prototype.getTargetOptions = function(target) {
    if(!target) {
        return this.targetOptions;
    }
    
    var pkg;
    if(this.programPackage) {
        pkg = this.programPackage;
    } else {
        pkg = this.targetPackage;
    }
    
    var spec = pkg.getDescriptor().getImplementsForUri("http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0");
    if(!UTIL.has(spec["builders"], target)) {
        throw new Error("Target with name '" + target + "' not found in program package: " + pkg.getPath());
    }
    var options = {};
    if(UTIL.has(spec["builders"][target], "depends")) {
        options = this.getTargetOptions(spec["builders"][target]["depends"]);
    }
    if(UTIL.has(spec["builders"][target], "options")) {
        UTIL.deepUpdate(options, spec["builders"][target]["options"]);
    }
    return options;
}

ProgramBuilder.prototype.getFileVersionPrefix = function() {
    
    return this.programPackage.getDescriptor().getVersion();

/*
    var packageID = URI.parse(this.programPackage.getUid()).directories.join("/"),
        locator = this.programPackage.getLocator(),
        fileVersion;

print(this.programPackage.getPath());
dump(locator);
dump(this.programPackage.getDescriptor());
print(this.programPackage.getDescriptor().getVersion());


    if(locator.hasPinnedVersion()) {

        // we have a pinned version
        // set version to locator.getPinnedVersion()

        throw new Error("Not yet implemented: " + module.path);

    } else {

        // we do NOT have a pinned version
        // set version to release date

        fileVersion = locator.getRevision();
print(" !!!fileVersion: "+fileVersion);
        if(!fileVersion) {
            // we have a simple revision string
            fileVersion = locator.getRevision();
        } else {
            var time = new Date()
            fileVersion = [
                "0.0.0" + fileVersion,
                (""+time.getFullYear()).substr(2,2),
                UTIL.padBegin(time.getMonth()+1, 2),
                UTIL.padBegin(time.getDate(), 2),
                UTIL.padBegin(time.getHours(), 2),
                UTIL.padBegin(time.getMinutes(), 2)
            ].join("");
        }
*/        
/*
THIS IS OLD
        var time = new Date(this.programPackage.getDescriptor().getPath().mtime());
        fileVersion = (""+time.getFullYear()) + "-" +
                      UTIL.padBegin(time.getMonth()+1, 2) + "-" +
                      UTIL.padBegin(time.getDate(), 2) + "-" +
                      UTIL.padBegin(time.getHours(), 2) + "-" +
                      UTIL.padBegin(time.getMinutes(), 2) + "-" +
                      UTIL.padBegin(time.getSeconds(), 2);
*/
//    }
    
//    return fileVersion;
}

ProgramBuilder.prototype.normalizeChangelog = function(changelogPath) {

    var changelog = changelogPath.read();

    var version = this.programPackage.getDescriptor().getVersion();

    // TODO: Determine Date
    // for now we assume the date is today as this runs as part of the distribution building process
    var time = new Date(),
        dateStr = (""+time.getFullYear()) + "-" +
                  UTIL.padBegin(time.getMonth()+1, 2) + "-" +
                  UTIL.padBegin(time.getDate(), 2);

    var m = changelog.match(/(^[\W\w]*?(TODO:\n[\W\w]*?)?\n)DONE:/);
    if(!m) {
        print("Changelog does not have 'DONE:' section!: "+ changelogPath);
//        throw new Error("Changelog does not have 'DONE:' section!");
        return;
    }

    changelog = changelog.replace(m[0], m[1] + dateStr + " - Release Version: " + version);
    changelogPath.write(changelog);

    print("Updated changelog at: "+ changelogPath);
}

ProgramBuilder.prototype.replaceVariables = function(file, variables) {
    variables = concatDeepKeys(variables);
    var data = file.read();
    var token = "%%";
    UTIL.keys(variables).forEach(function(name) {
        data = data.replace(new RegExp(token + regExpEscape(name) + token, "g"), variables[name]);
    });
    var reg = new RegExp(token + "([^" + token.substr(0,1) + "]*)" + token, "g"),
        m;
    while((m = reg.exec(data)) != null) {
        if(m[1]!="proto") {
            TERM.stream.print("  " + token + "\0red(" + m[1] + "\0)" + token + "\0red( was not replaced!\0)");
        }
    }
    file.write(data);
}

function concatDeepKeys(tree, map, prefix) {
    map = map || {};
    prefix = prefix || "";
    UTIL.forEach(tree, function(item) {
        if(typeof item[1] == "object") {
            concatDeepKeys(item[1], map, prefix + item[0] + ".");
        } else {
            map[prefix + item[0]] = item[1];
        }
    });
    return map;
}

var escapeExpression = /[\[\]]/g;
var escapePatterns = {
    '[': '\\[',
    ']': '\\]'
};
function regExpEscape(value) {
    return value.replace(
        escapeExpression, 
        function (match) {
            if (escapePatterns[match])
                return escapePatterns[match];
            return match;
        }
    );
};

ProgramBuilder.prototype.triggerBuild = function(options) {

    options = options || {};
    if(!options.monitor) {
        options.monitor = {
            "built": {}
        };
    }
    if(!options.buildStack) {
        options.buildStack = [];
    }
    var self = this;
        

    TERM.stream.print("\0cyan(*** Building PROGRAM Package ***\0)");
    TERM.stream.print("\0cyan(    source: "+this.sourcePackage.getPath()+"\0)");
    TERM.stream.print("\0cyan(    target: "+this.targetPackage.getPath()+"\0)");

    var sourceBasePath = this.sourcePackage.getPath(),
        buildBasePath = this.sourcePackage.getBuildPath().join("raw"),
        targetBasePath = this.targetPackage.getPath();

//    var buildPackage = PACKAGE.Package(buildBasePath, this.sourcePackage.getLocator());

    // TODO: Also rebuild when package.json  or any dependency has changed

    if(!buildBasePath.exists()) {
        
        buildBasePath.mkdirs();

        try {

            this.buildProgramPackage(this.sourcePackage, options);


        } catch(e) {
            // sanity check before nuking build directory
            if(buildBasePath.exists() &&
               buildBasePath.join("package.json").exists()) {

//print("NUKING: " + buildBasePath);            
//                OS.command("rm -Rf " + buildBasePath);
            }        
            throw e;
        }
    }


    var buildPackage = PACKAGE.Package(buildBasePath, this.sourcePackage.getLocator());

    targetBasePath.mkdirs();

    [
//        "package.json",  // NOTE: This is already being copied in: ProgramBuilder.prototype.buildProgramPackage
        "program.json"
    ].forEach(function(basename) {
        if(buildBasePath.join(basename).exists()) {
            // if package has a version it is a release we do not want to modify.
            // if it does not have a version it is likely linked to a workspace in which
            // case we do want to modify program.json
//            if(this.sourcePackage.getVersion()) {
                buildBasePath.join(basename).copy(targetBasePath.join(basename));

//            } else {
//                this.buildPackage.getPath().join(basename).symlink(targetBasePath.join(basename));
//            }
        }
    });
    
    
    // build all targets

    var implUri = "http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0",
        impl = this.sourcePackage.getDescriptor().getImplementsForUri(implUri);

    if(impl && UTIL.has(impl, "builders")) {
        
        if(!options.target && UTIL.has(impl, "defaultBuilder")) {

            buildTarget([impl["defaultBuilder"], impl["builders"][impl["defaultBuilder"]]]);
            
        } else
        if(options.target) {

            buildTarget([options.target, impl["builders"][options.target]]);

        }
/*        
        UTIL.every(impl["builders"], function(item) {
        });
*/
    }

    function buildTarget(item) {
        
        if(item[1].depends) {
            buildTarget([item[1].depends, impl["builders"][item[1].depends]]);
        }

        var targetPackagePath = self.sourcePackage.getBuildPath().join(item[0]);
        
//        if(targetPackagePath.exists() && item[0]!="raw") {
//            return;
//        }

        var locator = LOCATOR.PackageLocator(item[1]),
            pkg = self.sourcePackage;

        if(!locator.getModule()) {
            throw new Error("'builders."+item[0]+"' locator does not specify a 'module' property");
        }
        if(locator.isCatalog() || locator.isDirect()) {
            // the module is located in an external package
            pkg = PINF.getPackageForLocator(locator);
        } else {
            // the module is in our own package
            var newLocator = self.sourcePackage.getLocator().clone();
            newLocator.setModule(locator.getModule());
            locator = newLocator;
        }

        pkg.makeCallable();

        // load actual module now that package and dependencies are registered

        var builder;
        
        try {
            builder = require(locator.getModule(), pkg.getTopLevelId()).ProgramBuilder();
        } catch(e) {
            print(pkg.getTopLevelId() + " -> " + locator.getModule());
            throw e;
        }

        builder.setTarget(item[0]);

        builder.setTargetOptions(item[1]["options"]);

        builder.setProgramPackage(self.targetPackage);
        
        builder.setSourcePackage(self.sourcePackage);
        
        builder.setRawPackage(buildPackage);

        builder.setTargetPackage(PACKAGE.Package(targetPackagePath, self.sourcePackage.getLocator()));

        try {

            builder.build(options);
            
        } catch(e) {
            // sanity check before nuking build directory
            if(targetPackagePath.exists() &&
               targetPackagePath.join("../raw/package.json").exists()) {

//print("NUKING: " + targetPackagePath);            
//                    OS.command("rm -Rf " + targetPackagePath);
            }        
            throw e;
        }    
    }

    
    
    // link all built binaries
    var binPath = buildBasePath.join("bin");
    if(binPath.exists()) {
        targetBasePath.join("bin").mkdirs();
        binPath.listPaths().forEach(function(item) {
            item.symlink(targetBasePath.join("bin", item.basename()));
        });
    }
    
    
   

/*    
    // if there are *.local.* files in the workspace for this program we link them
    try {
        var workspace = PINF.getWorkspaceForSelector(pkg.getUid());
        if(workspace) {
            var repoInfo = pkg.getDescriptor().getRepositoryInfo(),
                basePath = workspace.getPath();
            if(repoInfo.path) {
                basePath = basePath.join(repoInfo.path);
            }
            [
                "package.local.json",
                "program.local.json"
            ].forEach(function(basename) {
                if(basePath.join(basename).exists() && !programPath.join(basename).exists()) {
                    basePath.join(basename).symlink(programPath.join(basename));
                }
            });
        }
    } catch(e) {
        // slient! - this is a flow-control try-catch which is fine as this is an edge use-case
    }
*/

}


ProgramBuilder.prototype.buildProgramPackage = function(sourcePackage, options) {

    options = options || {};
    var self = this;
    
    var sourceBasePath = this.sourcePackage.getPath(),
        targetBasePath = this.targetPackage.getPath();
    targetBasePath.mkdirs();

    var sourceDescriptor = this.sourcePackage.getDescriptor();

    // write package.json file (merged with package.local.json if avaiable)
    var file = targetBasePath.join("package.json");
    // set version
    var descriptor = sourceDescriptor.getSpec(),
        locator = this.sourcePackage.getLocator();
        
    // determine version for release        
    // TODO: Use provided version instead (if applicable)
    var time = new Date()
    descriptor.version = [
        "0.0.0" + locator.getRevision(),
        (""+time.getFullYear()).substr(2,2),
        UTIL.padBegin(time.getMonth()+1, 2),
        UTIL.padBegin(time.getDate(), 2),
        UTIL.padBegin(time.getHours(), 2),
        UTIL.padBegin(time.getMinutes(), 2)
    ].join("");
    file.write(JSON.encode(descriptor, null, "    "));
    

    // HACK: write program file first above, then modify below
    // add options
    // TODO: Remove old builders when done
    var programOptions = this.getTargetOptions(options.target);
    descriptor['implements']['http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0'].options = programOptions;
    file.write(JSON.encode(descriptor, null, "    "));


    var buildPackage = PACKAGE.Package(this.sourcePackage.getBuildPath().join("raw"), this.sourcePackage.getLocator());

    // write package.json after updating version
    var descriptor = JSON.decode(sourceBasePath.join("package.json").read());
    // HACK: merge local on top
    if(sourceBasePath.join("package.local.json").exists()) {
        UTIL.update(descriptor, JSON.decode(sourceBasePath.join("package.local.json").read()));
    }
    descriptor.version = this.targetPackage.getDescriptor().getVersion();
    descriptor['implements']['http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0'].options = programOptions;
    buildPackage.getPath().join("package.json").write(JSON.encode(descriptor, null, "  "));
    
//        sourceBasePath.join("package.json").copy(buildBasePath.join("package.json"));





    // instanciate program descriptor objects from source package
    // which will be updated during build process
    var remoteProgramDescriptor = JSON_STORE.JsonStore(sourceBasePath.join("program.json")),
        localProgramDescriptor = JSON_STORE.JsonStore(sourceBasePath.join("program.local.json")),
        programDescriptor = localProgramDescriptor;

    // select the appropriate program descriptor for our build
    if(options.remoteDependencies) {
        programDescriptor = remoteProgramDescriptor;
    }
    if(!programDescriptor.exists()) {
        programDescriptor.init();
    }


    var path;


    self.traversePackages(programDescriptor, sourceDescriptor, buildPackage, options);
    
    
/*
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
        sourceDescriptor[type[1].iterator](function(parentPackage, name, locator, stacks, property) {
            if(!locator) {
                return;
            }

            var key = ["packages", type[0]].concat(stacks.names).concat([name, "@"]);
print(key);
            if(options.remoteProgram) {
                if(!programDescriptor.has(key)) {
                    throw new Error("remote program.json is missing a locator for key: " + key.join(" -> "));
                }
                // overwite locator with the one from the program config
                locator = LOCATOR.PackageLocator(programDescriptor.get(key).locator);
            }

            if(options.remoteDependencies) {
                locator.setForceRemote(true);
            }

            var pkg = PINF.getPackageForLocator(locator);

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
                
                
//                path = targetBasePath.join("using", pkg.getTopLevelId());
                path = targetPackage.getPath().join("using", pkg.getTopLevelId());

                
//            }

            // update info in program.json file
            var info =  {};
            if(pkg.hasUid()) {
                info["uid"] = pkg.getUid();

                options.uidLocators[info["uid"]] = locator;
            }
            info["locator"] = locator.getSpec(true);
            programDescriptor.set(key, info);

print("id: "+pkg.getTopLevelId());
dump(options.monitor.built);            

            // only build package if not already built for program
            if(!UTIL.has(options.monitor.built, pkg.getTopLevelId())) {

                options.monitor.built[pkg.getTopLevelId()] = true;
            
                self.buildPackage(pkg, options);
    
    
                // if package has a version we need to copy it, otherwise we can link it (as it is likely a sources overlay)
                if(pkg.getVersion()) {
                    if(!path.exists()) {
                        path.dirname().mkdirs();
    print("COPY "+pkg.getPath()+" to "+path);                    
                        FILE.copyTree(pkg.getPath(), path);
                    }
                    // since we copied it to a specific version we need to update all package locators
                    // to include the exact version
                    if(!pkg.hasUid())
                    locatorRewriteInfo.push({
                        "id": parentPackage[type[1].id](),
                        "name": name,
                        "revision": pkg.getVersion()
                    });
                } else
                if(!path.exists() && !path.join("package.json").exists()) {
                    path.dirname().mkdirs();
    print("LINK "+pkg.getPath()+" to "+path);                    
                    pkg.getPath().symlink(path);
                }
    
                if(type[0]=="system") {
    //print("link system package from " + path + " to " + targetPackage.getPath().join("using", "packages", name));                
                                  
                    targetPackage.getPath().join("packages").mkdirs();
                    path.symlink(targetPackage.getPath().join("packages", name));
                }
            } else {
                return false;
            }

            return locator;
        }, {
            "packageStore": PINF.getDatabase().getPackageStore(),
            "package": self.sourcePackage
        });

        locatorRewriteInfo.forEach(function(info) {
            if(info.id==self.sourcePackage[type[1].id]()) {
                path = targetPackage.getPath().join("package.json");
            } else {
                path = targetPackage.getPath().join(type[1].directory, info.id).join("package.json");
            }

            // ensure we only update copied package.json files!
            if(targetPackage.getPath().join("using").relative(path.canonical()).valueOf().substring(0,1)==".") {
                // don't update as package.json file is not within built using directory
            } else {
                JSON_STORE.JsonStore(path).set([type[1].property, info.name, "revision"], info.revision);
            }
        });
    });
*/    
    
    // copy updated program descriptor
    programDescriptor.getFile().copy(targetBasePath.join("program.json"));

    
    // link all packages with no UID property which are packages that are managed as part of the sourcePackage
    // if a UID is present the package will end up in /using/ based on dependency declarations
    var sourcePackagesPath = sourceBasePath.join("packages"),
        targetPackagesPath = targetBasePath.join("packages");
    if(sourcePackagesPath.exists()) {
        targetPackagesPath.mkdirs();
        sourcePackagesPath.listPaths().forEach(function(item) {
            if(item.join("package.json").exists()) {
                if(!UTIL.has(JSON.decode(item.join("package.json").read().toString()), "uid")) {
                    item.symlink(targetPackagesPath.join(item.basename()));
                }
            }
        });
    };

/*

    // build tester
/*
TODO: This shoul happen dynamically when a test is executed

    var spec = descriptor.getPinfSpec();
    if(spec && spec.tester) {
        var pkg = PINF.getPackageForLocator(LOCATOR.PackageLocator(spec.tester));
        options.testPackage = pkg;
        pkg.getBuilder().triggerBuild(PACKAGE.Package(rawBuildPath), options);
    }
*/

}


ProgramBuilder.prototype.traversePackages = function(programDescriptor, packageDescriptor, targetPackage, options, monitor) {

    var self = this;

//    options.uidLocators = {};

    monitor = monitor || {
        "packages": {}
    };

    [
        {
            "name": "system",
            "method": "everyDependency"
        },
        {
            "name": "using",
            "method": "everyUsing"
        }
    ].forEach(function(type) {
        packageDescriptor[type.method](function(name, locator) {
            
            // just a string is defined - no JSON locator
            if(!locator) {
                return;
            }

            // skip if already in local monitor
            if(UTIL.has(monitor.packages, locator.getTopLevelId())) {
//print("   ... skip ... "+type.name+": "+name + " - " + locator.getTopLevelId());
                return;
            }
            monitor.packages[locator.getTopLevelId()] = true;

//print(type.name+": "+name + " - " + locator.getTopLevelId());

            var key = ["packages", locator.getTopLevelId()];

            if(options.remoteProgram) {
                if(!programDescriptor.has(key)) {
                    throw new Error("remote program.json is missing a locator for key: " + key.join(" -> "));
                }
                // overwite locator with the one from the program config
                locator = LOCATOR.PackageLocator(programDescriptor.get(key).locator);
            }

            if(options.remoteDependencies) {
                locator.setForceRemote(true);
            }

//dump(locator.getSpec());
            var pkg;
            try {
                pkg = PINF.getPackageForLocator(locator);
            } catch(e) {
                dump(locator.getSpec());
                throw e;
            }

            // linked packages do not contain 'version' properties
            if(pkg.getVersion()) {
                locator.pinAtVersion(pkg.getVersion());
            }

            // update info in program.json file
            var info =  {};
            if(pkg.hasUid()) {
                info["uid"] = pkg.getUid();

                
                // TODO: this needs to be handled differently (/Users/cadorn/pinf/workspaces/github.com/cadorn/narwhalrunner/packages/devtools/lib/build/program.js line 80)
 //               options.uidLocators[info["uid"]] = locator;
            }
            info["locator"] = locator.getSpec(true);
            programDescriptor.set(key, info);

//print("id: "+pkg.getTopLevelId());

            // only build package if not already built for program
            if(!UTIL.has(options.monitor.built, pkg.getTopLevelId())) {

                options.monitor.built[pkg.getTopLevelId()] = true;
            
                self.buildPackage(pkg, options);
                
                
                var path = targetPackage.getPath().join("using", pkg.getTopLevelId());
    
    
                // if package has a version we need to copy it, otherwise we can link it (as it is likely a sources overlay)
                if(pkg.getVersion()) {
                    if(!path.exists()) {
                        path.dirname().mkdirs();
    print("COPY "+pkg.getPath()+" to "+path);                    
                        FILE.copyTree(pkg.getPath(), path);
                    }
                    // since we copied it to a specific version we need to update all package locators
                    // to include the exact version
                    if(!pkg.hasUid()) {

//throw new Error("TODO: Rewrite package.json locators to include version info");                        

/*

        locatorRewriteInfo.forEach(function(info) {
            if(info.id==self.sourcePackage[type[1].id]()) {
                path = targetPackage.getPath().join("package.json");
            } else {
                path = targetPackage.getPath().join(type[1].directory, info.id).join("package.json");
            }

            // ensure we only update copied package.json files!
            if(targetPackage.getPath().join("using").relative(path.canonical()).valueOf().substring(0,1)==".") {
                // don't update as package.json file is not within built using directory
            } else {
                JSON_STORE.JsonStore(path).set([type[1].property, info.name, "revision"], info.revision);
            }
        });

                        
                        locatorRewriteInfo.push({
                            "id": parentPackage[type[1].id](),
                            "name": name,
                            "revision": pkg.getVersion()
                        });
*/
                    }
                } else
                if(!path.exists() && !path.join("package.json").exists()) {
                    path.dirname().mkdirs();
    print("LINK "+pkg.getPath()+" to "+path);                    
                    pkg.getPath().symlink(path);
                }
    
                if(type.name=="system") {
print("link system package from " + path + " to " + targetPackage.getPath().join("packages", name));                
                                  
                    targetPackage.getPath().join("packages").mkdirs();
                    path.symlink(targetPackage.getPath().join("packages", name));
                }
            }
            
            // traverse pkg dependencies
            self.traversePackages(programDescriptor, pkg.getDescriptor(), targetPackage, options, monitor);
        });
    });
}



ProgramBuilder.prototype.buildPackage = function(sourcePackage, options) {

    var buildBasePath = this.targetPackage.getBuildPath().join("raw"),
        buildPackage = PACKAGE.Package(buildBasePath, this.targetPackage.getLocator());

    var builder = PACKAGE_BUILDER.PackageBuilder();
    builder.setTarget("raw");
    builder.setSourcePackage(sourcePackage);
    builder.setTargetPackage(buildPackage);

    try {

        builder.triggerBuild(options);

    } catch(e) {
        // sanity check before nuking build directory
        if(buildBasePath.exists() &&
           buildBasePath.join("package.json").exists()) {

print("NUKING: " + buildBasePath);            
            OS.command("rm -Rf " + buildBasePath);
        }
        throw e;
    }
}
