

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var GIT = require("git", "util");
var PINF = require("./pinf");


var Remote = exports.Remote = function(pointer) {
    if (!(this instanceof exports.Remote))
        return new exports.Remote(pointer);
    this.pointer = pointer;
}


Remote.prototype.buildProgram = function(locator, options) {

print("build remote program on: " + this.pointer);

dump(locator.getSpec());    

dump(options);


    var workspace = this.getWorkspace();

print("workspace: " + workspace.getPath());


}

Remote.prototype.getWorkspace = function() {
    return PINF.getWorkspaceForSelector(this.pointer);
}



var RemoteError = exports.RemoteError = function(message) {
    this.name = "RemoteError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
RemoteError.prototype = new Error();
