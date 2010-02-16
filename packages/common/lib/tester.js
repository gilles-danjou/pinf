

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");
var PACKAGE = require("./package");
var FILE = require("file");


var Tester = exports.Tester = function(pkg) {
    if (!(this instanceof exports.Tester))
        return new exports.Tester(pkg);
    
    if(this.construct===Tester.prototype.construct) {
        this.construct(pkg);
    }
}

Tester.prototype.construct = function(pkg) {
    this.pkg = pkg;
}

Tester.prototype.getPackage = function() {
    return this.pkg;
}

Tester.prototype.triggerTest = function(targetPackage, testOptions) {
    
    
    // TODO: test preparation


    this.test(targetPackage, testOptions);
}

Tester.prototype.test = function(targetPackage, testOptions) {
    // to be overwritten
}


Tester.prototype.util = {
    
    "getCommandPath": function(targetPackage, name, platform) {
        
        var variations = targetPackage.getBuildPath().join("raw", "bin").glob(name + "*");
        if(!UTIL.len(variations)) {
            throw new Error("Need to build package. No phpunit test commands found at: " + targetPackage.getBuildPath().join("raw", "bin"));
        }
        var commands = {};
        variations.forEach(function(item) {
            var path = FILE.Path(item),
                parts = path.basename().valueOf().split("-");
            commands[(parts.length>1)?parts.pop():"*"] = path;
        });
        var platformName = "*";
        if(platform) {
            platformName = platform.getName();
        }
        if(commands[platformName]) {
            return commands[platformName];
        } else
        if(!platform && commands.length==1) {
            return commands[UTIL.keys(commands)[0]];
        }
        throw new Error("You need to provide a platform to select a specific command for '"+name+"' at: " + targetPackage.getBuildPath().join("raw", "bin"));
    }
}
