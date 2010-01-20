

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var FS_STORE = require("http/fs-store");
var PROGRAM = require("../program");


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

ProgramStore.prototype.get = function(locator) {

    var pkg = this.packageStore.get(locator);
    var programPath = FS_STORE.get(this.path.join("programs"), pkg.getDescriptor().getUid());

    if(programPath.exists() && programPath.canonical().valueOf()==pkg.getPath().valueOf()) {
        var program = PROGRAM.Program(programPath, locator);
        program.setPackageStore(this.packageStore);
        return program;
    }

    if(programPath.exists()) {
        programPath.remove();
    } else {
        programPath.dirname().mkdirs();
    }

    pkg.getPath().symlink(programPath);

    var program = PROGRAM.Program(programPath, locator);
    program.setPackageStore(this.packageStore);
    return program;
}

