

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
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
    
    if(!this.spec.has(["name"])) {
        throw new Error("No 'name' property in: " + this.path.join("program.json"));
    }
}

Program.prototype = PACKAGE.Package();


Program.prototype.getName = function() {
    return this.spec.get(["name"]);
}


Program.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}


Program.prototype.clean = function(options) {
    if(options.path.exists()) {
        // basic sanity check before we delete the previous build
        if(options.path.join("raw", "package.json").exists()) {
            OS.command("rm -Rf " + options.path.valueOf());
        }
    }
}

Program.prototype.build = function(options) {
    var self = this;

    options = options || {};
    if(!options.path) {
        options.path = this.getPath().join(".build");
    }
    
    options.path = options.path.join(this.spec.get(["name"]));

    this.clean(options);

    var descriptor = this.getDescriptor(),
        buildPath = options.path.join("raw"),
        path;
        
    // link package.json file
    path = buildPath.join("package.json");
    path.dirname().mkdirs();
    this.getPath().join("package.json").symlink(path);


    // link all system and using packages to desired versions
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

        var locatorRewriteInfo = [],
            visited = {};
        descriptor[type[1].iterator](function(parentPackage, name, locator, stacks) {
            var key = ["config", type[0]].concat(stacks.names).concat([name, "$"]);
            if(!self.spec.has(key)) {
                // no version set - use base revision from locator
            } else {
                // use version we have set
                locator.pinAtVersion(self.spec.get(key).version);
            }

            var pkg = self.packageStore.get(locator);
            // linked packages do not contain 'version' properties
            if(pkg.getVersion()) {
                locator.pinAtVersion(pkg.getVersion());
            }
    
            path = buildPath.join(type[1].directory, pkg[type[1].id]());
            
            if(visited[path.valueOf()]) {
                return locator;
            }
            visited[path.valueOf()] = true;
            
            path.dirname().mkdirs();
 
            // if package has a version we need to copy it, otherwise we can link it (as it is likely a sources overlay)
            if(pkg.getVersion()) {
                FILE.copyTree(pkg.getPath(), path);
                // since we copied it to a specific version we need to update all using package locators
                // to include the exact version
                locatorRewriteInfo.push({
                    "id": parentPackage[type[1].id](),
                    "name": name,
                    "version": pkg.getVersion()
                });
            } else {
                pkg.getPath().symlink(path);
            }
    
    /*
            self.spec.set(key, {
                "uid": usingPackage.getUid(),
                "version": locator.getPinnedVersion()
            });
    */
            return locator;
        }, {
            "packageStore": self.packageStore,
            "package": self
        });
    
        locatorRewriteInfo.forEach(function(info) {
            if(info.id==self.getTopLevelId()) {
                path = self.getPath();
            } else {
                path = buildPath.join(type[1].directory, info.id);
            }
            JSON_STORE.JsonStore(path.join("package.json")).set([type[1].property, info.name, "revision"], info.version);
        });
    });
    

    var builder = this.getBuilder({
        "packageStore": this.packageStore
    });

    builder.triggerBuild(this, options);
    
    return options.path;
}

