

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var PROGRAM = require("../program");
var PACKAGE = require("../package");
var PROGRAM_BUILDER = require("../builder/program");
var PINF = require("../pinf");
var OS = require("os");


var ProgramStore = exports.ProgramStore = function(path) {
    if (!(this instanceof exports.ProgramStore))
        return new exports.ProgramStore(path);

    this.path = path;
}

ProgramStore.prototype.exists = function() {
    return this.path.exists();
}

ProgramStore.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}

ProgramStore.prototype.getBasePath = function() {
    return this.path.join("programs");
}

ProgramStore.prototype.getPathForLocator = function(locator) {
    var pkg = this.packageStore.get(locator);
    return this.getBasePath().join(pkg.getTopLevelId());
}

ProgramStore.prototype.has = function(locator) {
    
//dump(locator);

//print("HAS::: " + this.packageStore.get(locator).getPath());
//print("HAS::: " + this.getPathForLocator(locator));

//    var sourcePackage = this.packageStore.get(locator);
    
    
    return this.getPathForLocator(locator).exists();
}

ProgramStore.prototype.get = function(locator) {

    var programPath = this.getPathForLocator(locator);

    if(!programPath.exists()) {
        throw new Error("Program does not exist at: " + programPath);
    }
    
    return PROGRAM.Program(programPath, locator);
}

ProgramStore.prototype.build = function(locator, options) {

    var programPath = this.getPathForLocator(locator);
    
    if(programPath.exists()) {
        throw new Error("Program already built at path: " + programPath);
    }

    var sourcePackage = this.packageStore.get(locator);

    if(!sourcePackage.getPath().join("program.json").exists()) {
        throw new Error("Package not a program at path: " + sourcePackage.getPath());
    }

    var programPackage = PROGRAM.Program(programPath, locator);

    var builder = PROGRAM_BUILDER.ProgramBuilder();

    builder.setSourcePackage(sourcePackage);
    builder.setTargetPackage(programPackage);

    try {

        builder.triggerBuild(options);

    } catch(e) {
        // sanity check before nuking build directory
        if(programPath.exists() &&
           programPath.join("package.json").exists()) {

print("NUKING: " + programPath);            
            OS.command("rm -Rf " + programPath);
        }        
        throw e;
    }

    return programPackage;
}

