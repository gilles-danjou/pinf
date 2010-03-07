

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");
var PACKAGE = require("./package");
var FILE = require("file");


var Launcher = exports.Launcher = function(pkg) {
    if (!(this instanceof exports.Launcher))
        return new exports.Launcher(pkg);
    
    if(this.construct===Launcher.prototype.construct) {
        this.construct(pkg);
    }
}

Launcher.prototype.construct = function(pkg) {
    this.pkg = pkg;
}

Launcher.prototype.getPackage = function() {
    return this.pkg;
}

Launcher.prototype.triggerLaunch = function(targetPackage, launchOptions) {
    
    
    // TODO: test preparation


    this.launch(targetPackage, launchOptions);
}

Launcher.prototype.launch = function(targetPackage, launchOptions) {
    // to be overwritten
    throw new Error("You need to declare a launcher in the package descriptor!");
}

