

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

ProgramBuilder.prototype.setTarget = function(target) {
    this.target = target;
}

ProgramBuilder.prototype.getTarget = function() {
    return this.target;
}

ProgramBuilder.prototype.triggerBuild = function(options) {
    
    options = options || {};
    var self = this;

    TERM.stream.print("\0cyan(*** Building PROGRAM Package ***\0)");
    TERM.stream.print("\0cyan(    source: "+this.sourcePackage.getPath()+"\0)");
    TERM.stream.print("\0cyan(    target: "+this.targetPackage.getPath()+"\0)");

    var sourceBasePath = this.sourcePackage.getPath(),
        buildBasePath = this.sourcePackage.getBuildPath().join("raw"),
        targetBasePath = this.targetPackage.getPath();


    var buildPackage = PACKAGE.Package(buildBasePath, this.sourcePackage.getLocator());

    // TODO: Also rebuild when package.json  or any dependency has changed

    if(!buildBasePath.exists()) {
        
        buildBasePath.mkdirs();

        // copy package.json
        sourceBasePath.join("package.json").copy(buildBasePath.join("package.json"));

        try {

            this.buildProgramPackage(this.sourcePackage, buildPackage, options);

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


    targetBasePath.mkdirs();

    [
        "package.json",
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
        UTIL.every(impl["builders"], function(item) {

            var targetPackagePath = self.sourcePackage.getBuildPath().join(item[0]);
            
            if(targetPackagePath.exists() && item[0]!="raw") {
                return;
            }

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

            var builder = require(locator.getModule(), pkg.getTopLevelId()).ProgramBuilder();

            builder.setTarget(item[0]);
            
            builder.setSourcePackage(self.sourcePackage);

            builder.setTargetPackage(PACKAGE.Package(targetPackagePath, self.sourcePackage.getLocator()));

            try {

                builder.build(options);
                
            } catch(e) {
                // sanity check before nuking build directory
                if(targetPackagePath.exists() &&
                   targetPackagePath.join("../raw/package.json").exists()) {
    
print("NUKING: " + targetPackagePath);            
                    OS.command("rm -Rf " + targetPackagePath);
                }        
                throw e;
            }
        });
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


ProgramBuilder.prototype.buildProgramPackage = function(sourcePackage, targetPackage, options) {

    options = options || {};
    var self = this;
    
    var sourceBasePath = this.sourcePackage.getPath(),
        targetBasePath = this.targetPackage.getPath();
    targetBasePath.mkdirs();

    var sourceDescriptor = this.sourcePackage.getDescriptor();

    // write package.json file (merged with package.local.json if avaiable)
    var file = targetBasePath.join("package.json");
    file.write(JSON.encode(sourceDescriptor.getSpec(), null, "    "));


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
                path = self.targetPackage.getBuildPath().join("raw", "using", pkg.getTopLevelId());
                
//            }

            // update info in program.json file
            var info =  {};
            if(pkg.hasUid()) {
                info["uid"] = pkg.getUid();

                options.uidLocators[info["uid"]] = locator;
            }
            info["locator"] = locator.getSpec(true);
            programDescriptor.set(key, info);
            

            
    self.buildPackage(pkg, options);


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
            if(!path.exists() && !path.join("package.json").exists()) {
                path.dirname().mkdirs();
                pkg.getPath().symlink(path);
            }

            return locator;
        }, {
            "packageStore": PINF.getDatabase().getPackageStore(),
            "package": self.sourcePackage
        });

        locatorRewriteInfo.forEach(function(info) {
            if(info.id==self[type[1].id]()) {
                path = targetBasePath.join("package.json");
            } else {
                path = targetBasePath.join(type[1].directory, info.id).join("package.json");
            }
            JSON_STORE.JsonStore(path).set([type[1].property, info.name, "revision"], info.revision);
        });
    });
    
    
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
