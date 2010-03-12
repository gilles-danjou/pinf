

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");
var OS = require("os");


var DEBUG = true;

var debugStrDepth = 0;


var Builder = exports.Builder = function(pkg, options) {
    if (!(this instanceof exports.Builder))
        return new exports.Builder(pkg, options);

    if(this.construct===Builder.prototype.construct) {
        this.construct(pkg, options);
    }
}

Builder.prototype.construct = function(pkg, options) {
    this.pkg = pkg;
    this.options = options;
}

Builder.prototype.getLocatorForSpec = function(locator) {
    return LOCATOR.PackageLocator(locator);
}

Builder.prototype.getPackageForLocator = function(locator) {
    return PINF.getPackageForLocator(locator);
}

/**
 * @deprecated
 */
Builder.prototype.triggerBuild = function(targetPackage, buildOptions) {

    debugStrDepth++;
    var debugStrPrefix = "";
    for(var i=0;i<debugStrDepth;i++) debugStrPrefix += debugStrDepth+"    ";

    if(DEBUG) print(debugStrPrefix + "Builder.prototype.triggerBuild: " + this.pkg.getPath());

    var descriptor = this.pkg.getDescriptor(),
        spec = descriptor.getPinfSpec(),
        self = this;

    if(DEBUG) print(debugStrPrefix + "  -- prepare:");

    this.prepare(targetPackage, buildOptions);

    if(DEBUG) print(debugStrPrefix + "  -- build programs:");

    // install/build all dependent programs
    descriptor.everyProgram(function(name, locator) {
        var pkg = PINF.getDatabase().getProgram(locator);
        pkg.build({
            "remoteProgram": false,
            "remoteDependencies": false,
            "args": []
        });
    });

    if(DEBUG) print(debugStrPrefix + "  -- build platforms:");

    // install/build all dependent platforms
    descriptor.everyPlatform(function(name, locator) {
        if(DEBUG) print(debugStrPrefix + "     platform: " + name);
        var platform = PINF.getPlatformForLocator(locator);
        if(!platform.exists()) {
            platform.init(locator);
        }
    });

    if(DEBUG) print(debugStrPrefix + "  -- build system packages:");

    // build all dependencies
    descriptor.everyDependency(function(name, locator) {
        if(!(locator instanceof LOCATOR.PackageLocator)) return;
        if(DEBUG) print(debugStrPrefix + "     package: " + name);
        var pkg = self.getPackageForLocator(locator);
        var builder = pkg.getBuilder(self.options);
        builder.triggerBuild(targetPackage, buildOptions);        
    });

    if(DEBUG) print(debugStrPrefix + "  -- build using packages:");

    // build all using packages
    var usingBuildOptions = UTIL.copy(buildOptions);
    usingBuildOptions["skipWriteCommands"] = true;
    descriptor.everyUsing(function(name, locator) {
        if(DEBUG) print(debugStrPrefix + "     package: " + name);
        
        var pkg = self.getPackageForLocator(locator);
        var builder = pkg.getBuilder(self.options);
        builder.triggerBuild(targetPackage, usingBuildOptions);        
    });

    if(DEBUG) print(debugStrPrefix + "  -- build commands:");
/*
    // copy all declared commands
    if(spec.commands && !buildOptions["skipWriteCommands"]) {
        var sourcePath,
            targetPath;
        UTIL.every(spec.commands, function(command) {
            var info;
            if(typeof command[1] != "object") {
                throw new Error("Command definition must be an object!");
            }
            if(!command[1].path) {
                throw new Error("Command definition contains no 'path' property!");
            }

            sourcePath = self.pkg.getPath().join(command[1].path);
            if(!sourcePath.exists()) {
                throw new Error("Command declared at 'pinf.commands['"+command[0]+"'] not found at: " + sourcePath);
            }
            targetPath = targetPackage.getPath().join("bin", command[0]);
            targetPath.dirname().mkdirs();

            var contents = sourcePath.read();
            if(command[1].platform) {
                var locator = descriptor.getPlatformLocatorForName(command[1].platform);
                if(!locator) {
                    throw new Error("Platform with name '" +command[1].platform+ "' not defined in: " + descriptor.getPath());
                }
                var platform = PINF.getPlatformForLocator(locator),
                    variations = platform.getVariations({
                        "pkg": self.pkg
                    });
                // write a binary file for each variation if applicable
                if(UTIL.len(variations)>0) {
                    variations.forEach(function(variantPlatform) {
                        var name = variantPlatform.getName();
                        if(!/^[A-Za-z0-9_-]*$/.test(name)) {
                            throw new Error("Platform name '" + name + "' not a valid variation string ([A-Za-z0-9_-]) ... from platform: " + variantPlatform.getPath());
                        }
                        var variantContents = variantPlatform.expandMacros({
                                "pkg": self.pkg,
                                "targetPackage": targetPackage,
                                "testPackage": buildOptions.testPackage
                            }, contents),
                            variantTargetPath = targetPath.dirname().join(targetPath.basename() + "-" + name);

                        variantTargetPath.write(variantContents);
                        variantTargetPath.chmod(0755);
                    });
                    return;
                } else {
                    contents = platform.expandMacros({
                        "pkg": self.pkg,
                        "targetPackage": targetPackage,
                        "testPackage": buildOptions.testPackage
                    }, contents);
                }
            }

            if(DEBUG) print(debugStrPrefix + "     command: " + targetPath);
            
            targetPath.write(contents);
            targetPath.chmod(0755);
        });
    }
*/
    if(DEBUG) print(debugStrPrefix + "  -- build:");

    this.build(targetPackage, buildOptions);

    if(DEBUG) print(debugStrPrefix + "DONE Builder.prototype.triggerBuild");

    debugStrDepth--;
}

Builder.prototype.prepare = function(program, options) {
    // to be overwritten
}

Builder.prototype.build = function(program, options) {
    // to be overwritten
}



Builder.prototype.util = {
    "backupFile": function(path) {
        if(!path.exists()) return;
        var backupPath = PINF.getDatabase().getBackupPath(path);
        var time = new Date(path.mtime()),
            stamp = (""+time.getFullYear()) + "-" +
                    UTIL.padBegin(time.getMonth()+1, 2) + "-" +
                    UTIL.padBegin(time.getDate(), 2) + "-" +
                    UTIL.padBegin(time.getHours(), 2) + "-" +
                    UTIL.padBegin(time.getMinutes(), 2) + "-" +
                    UTIL.padBegin(time.getSeconds(), 2);
        backupPath = backupPath.dirname().join(backupPath.basename() + "~" + stamp);
        if(backupPath.exists()) return backupPath;
        backupPath.dirname().mkdirs();
        path.copy(backupPath);
        return backupPath;
    },
    "accessPrivilegedFile": function(path, callback) {
        if(!path.exists()) {
            throw new Error("File does not exist at path: " + path);
        }
        if(!path.isFile()) {
            throw new Error("No file at path: " + path);
        }

        // TODO: Check context, policies and credentials to auto-supply password to sudo

        var tmpPath = path.dirname().join(path.basename() + "~pinf-tmp");

        var uid = UTIL.trim(OS.command("echo $UID"));
        if(!uid) {
            throw new Error("unable to determine UID");
        }

        OS.command("sudo cp " + path + " " + tmpPath + " ; sudo chmod 775 " + tmpPath + " ; sudo chown " + uid + " " + tmpPath);

        try {
            callback(tmpPath);
            OS.command("sudo sh -c 'cat " + tmpPath + " > " + path + "'");
        } catch(e) {
            throw e;
        } finally {
            OS.command("sudo rm -f " + tmpPath);
        }
    }
}


