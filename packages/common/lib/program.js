

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var OS = require("os");
var JSON_STORE = require("json-store", "util");
var PACKAGE = require("./package");


var Program = exports.Program = function(path, locator) {
    if (!(this instanceof exports.Program))
        return new exports.Program(path, locator);
        
    this.path = path;
    this.locator = locator;
    
    if(!this.path.join("program.json").exists()) {
        throw new Error("Program descriptor file not found at: " + this.path.join("program.json"));
    }
    
    this.spec = JSON_STORE.JsonStore(this.path.join("program.json"));
}

Program.prototype = PACKAGE.Package();


Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


Program.prototype.clean = function() {
    var path = this.getPath();
    [
//        ".dependencies",
//        ".using",
        ".build"
//        ".tmp",
//        ".narwhal"
    ].forEach(function(dir) {
        OS.command("rm -Rf " + path.join(dir));
    });
}

Program.prototype.build = function() {
    var self = this;

    this.clean();

    var descriptor = this.getDescriptor(),
        path;
        
    // link package.json file
    path = this.getPath().join(".build", "package.json");
    path.dirname().mkdirs();
    this.getPath().join("package.json").symlink(path);

    // link all using packages to desired versions
    descriptor.traverseEveryUsing(function(pkg, name, locator, stacks) {

        var key = ["config", "using"].concat(stacks.names).concat([name, "$"]);
        if(!self.spec.has(key)) {
            // no version set - use base revision from locator
        } else {
            // use version we have set
            locator.pinAtVersion(self.spec.get(key).version);
        }

        var usingPackage = self.packageStore.get(locator);
        locator.pinAtVersion(usingPackage.getVersion());

        path = self.getPath().join(".build", "using", locator.getFsPath(), usingPackage.getVersion());
        path.dirname().mkdirs();
        usingPackage.getPath().symlink(path);

/*
TODO: Move this to Program.prototype.freeze()
        self.spec.set(key, {
            "uid": usingPackage.getUid(),
            "version": locator.getPinnedVersion()
        });
*/
        return locator;
    }, {
        "packageStore": this.packageStore,
        "package": this
    });

    var builder = this.getBuilder({
        "packageStore": this.packageStore
    });

    builder.build(this);
}

