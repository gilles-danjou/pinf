

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var LOCATOR = require("../package/locator");
var PINF = require("../pinf");
var TERM = require("term");
var JSON = require("json");
var UTIL = require("util");
var PACKAGE = require("../package");
var JSON_STORE = require("json-store", "util");
var OS = require("os");
var FILE = require("file");


var ProgramPublisher = exports.ProgramPublisher = function() {
    if (!(this instanceof exports.ProgramPublisher))
        return new exports.ProgramPublisher();
}

ProgramPublisher.prototype.setProgramPackage = function(pkg) {
    this.programPackage = pkg;
}

ProgramPublisher.prototype.setTarget = function(target) {
    this.target = target;
}

ProgramPublisher.prototype.setTargetOptions = function(options) {
    this.targetOptions = options;
}

ProgramPublisher.prototype.getTarget = function() {
    return this.target;
}

ProgramPublisher.prototype.getTargetOptions = function() {
    return this.targetOptions;
}

ProgramPublisher.prototype.triggerPublish = function() {

    var self = this;

    TERM.stream.print("\0cyan(*** Publish PROGRAM Package ***\0)");
    TERM.stream.print("\0cyan(    program: "+this.programPackage.getPath()+"\0)");

    // publish all targets

    var implUri = "http://registry.pinf.org/cadorn.org/github/pinf/@meta/program/package/0.1.0",
        impl = this.programPackage.getDescriptor().getImplementsForUri(implUri);

    if(impl && UTIL.has(impl, "publishers")) {
        UTIL.every(impl["publishers"], function(item) {

            var targetPackagePath = self.programPackage.getBuildPath().join(item[0]);
            
            if(!targetPackagePath.exists()) {
                throw new Error("No files found at: " + targetPackagePath);
            }

            var locator = LOCATOR.PackageLocator(item[1]),
                pkg = self.programPackage;

            if(!locator.getModule()) {
                throw new Error("'publishers."+item[0]+"' locator does not specify a 'module' property");
            }
            if(locator.isCatalog() || locator.isDirect()) {
                // the module is located in an external package
                pkg = PINF.getPackageForLocator(locator);
            } else {
                // the module is in our own package
                var newLocator = self.programPackage.getLocator().clone();
                newLocator.setModule(locator.getModule());
                locator = newLocator;
                pkg = PINF.getPackageForLocator(locator);
            }

            pkg.makeCallable();
    
            // load actual module now that package and dependencies are registered

            var publisher;
            
            try {
                publisher = require(locator.getModule(), pkg.getTopLevelId()).ProgramPublisher();
            } catch(e) {
                print(pkg.getTopLevelId() + " -> " + locator.getModule());
                throw e;
            }

            publisher.setTarget(item[0]);

            publisher.setTargetOptions(item[1]["options"]);

            publisher.setProgramPackage(self.programPackage);

            publisher.publish();
        });
    }
}
