

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var VALIDATOR = require("validator", "util");
var SEMVER = require("semver", "util");
var LOCATOR = require("./locator");
var VENDOR = require("../vendor");


var PackageDescriptor = exports.PackageDescriptor = function(path) {
    if (!(this instanceof exports.PackageDescriptor))
        return new exports.PackageDescriptor(path);

    if(path instanceof FILE.Path) {
        this.path = path;

        if(!path.exists()) {
            throw new PackageDescriptorError("No package descriptor found at: " + path);
        }
        try {
            this.spec = JSON.decode(path.read());
        } catch(e) {
            throw new PackageDescriptorError("Error parsing package descriptor"+((this.path)?(" at: " + this.path):""));
        }

        // overlay local spec
        if(path.dirname().join("package.local.json").exists()) {
            this.localSpec = JSON.decode(path.dirname().join("package.local.json").read());
            this.globalSpec = UTIL.deepCopy(this.spec);
            this.spec = UTIL.deepCopy(this.globalSpec);
            UTIL.deepUpdate(this.spec, this.localSpec);
        }

    } else {
        this.spec = path;
    }
    
    if(!this.globalSpec) {
        this.globalSpec = UTIL.deepCopy(this.spec);
    } 
    
    if(!this.spec) {
        throw new PackageDescriptorError("Empty package descriptor"+((this.path)?(" at: " + this.path):""));
    }
    if(!this.spec.name) {
        throw new PackageDescriptorError("No 'name' property in package descriptor"+((this.path)?(" at: " + this.path):""));
    }
}

PackageDescriptor.prototype.setSaveLocal = function(saveLocal) {
    this.saveLocal = saveLocal;
}

PackageDescriptor.prototype.save = function() {
    if(!this.path) {
        throw new PackageDescriptorError("Cannot save package descriptor");
    }
    if(this.saveLocal) {
        var localSpec = UTIL.deepDiff(this.spec, this.globalSpec);
        if(localSpec) {
            this.path.dirname().join("package.local.json").write(JSON.encode(localSpec, null, "    "));
        }
    } else {
        this.path.write(JSON.encode(this.spec, null, "    "));
    }
}

PackageDescriptor.prototype.getPath = function() {
    return this.path || false;
}

PackageDescriptor.prototype.getName = function() {
    return this.spec.name || false;
}

PackageDescriptor.prototype.getVersion = function() {
    return this.spec.version || false;
}

PackageDescriptor.prototype.getPinfSpec = function() {
    return this.spec.pinf || false;
}

PackageDescriptor.prototype.getPlatform = function() {
    if(!this.spec.pinf) return false;
    return this.spec.pinf.platform || false;
}

PackageDescriptor.prototype.getTopLevelId = function() {

}

PackageDescriptor.prototype.hasUid = function() {
    if(!this.spec.uid) return false;
    return true;
}

PackageDescriptor.prototype.getUid = function() {
    if(!this.spec.uid) {
        throw new PackageDescriptorError("No 'uid' property in package descriptor"+((this.path)?(" at: " + this.path):""));
    }
    var uri;
    try {
        uri = VALIDATOR.validate("url", this.spec.uid, {
            "require": [
                ["path", {"trailingSlash": true}]
            ],
            "return": "uri"
        });
    } catch(e) {
        throw new PackageDescriptorError("Validation error: " + e + ((this.path)?(" at: " + this.path):""));
    }
    if(uri.directories[uri.directories.length-1]!=this.spec.name) {
        throw new PackageDescriptorError("The 'uid' property does not have the 'name' property at the end of the URI in package descriptor"+((this.path)?(" at: " + this.path):""));
    }
    return this.spec.uid;
}

PackageDescriptor.prototype.setUid = function(uid) {
    // insert 'uid' at the top of the package descriptor
    this.spec = UTIL.complete({
        "uid": uid
    }, this.spec);
    this.save();
}

PackageDescriptor.prototype.getRegistryUri = function() {
    // trim the 'name' part from the uid
    var parts = this.getUid().split("/");
    return parts.slice(0, parts.length-2).join("/") + "/";
}

PackageDescriptor.prototype.validate = function(options) {
    options = options || {};
    options.path = this.path || null;
    return exports.validate(this.spec, options);
}

PackageDescriptor.prototype.getCompletedSpec = function() {
    
    var descriptor = UTIL.copy(this.spec);
    
    // repositories
    if(descriptor.repositories) {
        descriptor.repositories.forEach(function(repository) {
            if(!repository.raw) {
                var url = VENDOR.rawUrlForRepository(repository);
                if(url) {
                    repository.raw = url;
                }
                var info = VENDOR.downloadInfoForRepository(repository);
                if(info) {
                    repository.download = info;
                }
            }
        });
    }
    
    return descriptor;
}

PackageDescriptor.prototype.getRepositoryInfo = function() {
    var spec = this.getCompletedSpec();
    if(!spec.repositories) return false;
    return spec.repositories[0];
}

PackageDescriptor.prototype.getImplementsForUri = function(uri) {
    if(!this.spec["implements"]) {
        return false;
    }
    if(!this.spec["implements"][uri]) {
        return false;
    }
    return this.spec["implements"][uri];
}

PackageDescriptor.prototype.getPlatformLocatorForName = function(name) {
    if(!this.spec.pinf || !this.spec.pinf.platforms) {
        return false;
    }
    if(!this.spec.pinf.platforms[name]) {
        return false;
    }
    return LOCATOR.PackageLocator(this.spec.pinf.platforms[name]);
}

PackageDescriptor.prototype.getUsingLocatorForName = function(name) {
    if(!this.spec.using) {
        return false;
    }
    if(!this.spec.using[name]) {
        return false;
    }
    return LOCATOR.PackageLocator(this.spec.using[name]);
}

PackageDescriptor.prototype.getDependencyLocatorForName = function(name) {
    if(!this.spec.dependencies) {
        return false;
    }
    if(UTIL.isArrayLike(this.spec.dependencies) || !this.spec.dependencies[name]) {
        return false;
    }
    return LOCATOR.PackageLocator(this.spec.dependencies[name]);
}

PackageDescriptor.prototype.everyUsing = function(callback) {
    if(!this.spec.using) {
        return false;
    }
    UTIL.every(this.spec.using, function(item) {
        callback(item[0], LOCATOR.PackageLocator(item[1]));
    });
    return true;
}

PackageDescriptor.prototype.everyPlatform = function(callback) {
    if(!this.spec.pinf || !this.spec.pinf.platforms) {
        return false;
    }
    UTIL.every(this.spec.pinf.platforms, function(item) {
        callback(item[0], LOCATOR.PackageLocator(item[1]));
    });
    return true;
}

PackageDescriptor.prototype.everyProgram = function(callback) {
    if(!this.spec.pinf || !this.spec.pinf.programs) {
        return false;
    }
    UTIL.every(this.spec.pinf.programs, function(item) {
        callback(item[0], LOCATOR.PackageLocator(item[1]));
    });
    return true;
}


PackageDescriptor.prototype.everyDependency = function(callback) {
    if(!this.spec.dependencies) {
        return false;
    }
    UTIL.every(this.spec.dependencies, function(item) {
        var locator;
        if(typeof item == "string") {
            callback(item, locator);
        } else {
            locator = item[1];
            try {
                locator = LOCATOR.PackageLocator(locator);
            } catch(e) {};
            callback(item[0], locator);
        }
    });
    return true;
}

PackageDescriptor.prototype.everyImplements = function(callback) {
    if(!this.spec["implements"]) {
        return false;
    }
    UTIL.every(this.spec["implements"], function(item) {
        callback(item[0], item[1]);
    });
    return true;
}


PackageDescriptor.prototype.traverseEveryDependency = function(callback, options) {
    return this.traverseEveryLocator("dependencies", callback, options);
}

PackageDescriptor.prototype.traverseEveryUsing = function(callback, options) {
    return this.traverseEveryLocator("using", callback, options);
}

PackageDescriptor.prototype.traverseEveryLocator = function(property, callback, options, stacks) {
    if(!options || !options.packageStore) {
        throw new PackageDescriptorError("options.packageStore not provided");
    }
    if(!options || !options["package"]) {
        throw new PackageDescriptorError("options.package not provided");
    }
    stacks = stacks || {"names": []};
    var locator,
        self = this,
        itemOptions = UTIL.copy(options);
        
    var properties = [property];
    // traverse using packages to look for dependencies
    if(property=="dependencies") {
        properties.push("using");
    }
    properties.forEach(function(prop) {
        // ignore if no spec or spec is an array (i.e. spec must be an object with a bunch of locators)
        if(!self.spec[prop] || UTIL.isArrayLike(self.spec[prop])) {
            return;
        }
        UTIL.every(self.spec[prop], function(item) {
            if(typeof item[1] == "object") {
                locator = LOCATOR.PackageLocator(item[1]);
                if(locator.isCatalog() || locator.isDirect()) {
                    locator = callback(options["package"], item[0], locator, stacks, prop) || locator;
                    if(!locator) {
                        return;
                    }
                    itemOptions["package"] = options.packageStore.get(locator);
                    stacks.names.push(item[0]);
                    itemOptions["package"].getDescriptor().traverseEveryLocator(property, callback, itemOptions, stacks);
                    stacks.names.pop();
                }
            }
        });
    });
    return true;
}

PackageDescriptor.prototype.getDownloadInfo = function() {
    if(!this.spec.repositories) {
        throw new PackageDescriptorError("No 'repositories' property");
    }
    // TODO: Option to use alternate repositories instead of just repositories[0]
    var repository = this.spec.repositories[0];
    if(!repository.download) {
        throw new PackageDescriptorError("No 'repositories[0].download' property");
    }
    if(!repository.download.url) {
        throw new PackageDescriptorError("No 'repositories[0].download.url' property");
    }
    var uri = URI.parse(repository.download.url),
        rev,
        type = repository.download.type || false,
        version = this.spec.version,
        m;
    if(SEMVER.validate(version, {"numericOnly": true})) {
        rev = "v" + version;
    } else
    if(version && (m = version.match(/^0\.0\.0rev-(.*)$/))) {
        rev = m[1];
    } else {
        rev = "v" + version;
    }
    if(repository.path && rev.substr(0,1)=="v") {
        rev = repository.path + "/" + rev;
    }
    if(!type) {
        if(!uri.file) {
            throw new PackageDescriptorError("Cannot guess archive type. No 'file' component in download url.");
        }
        var ext = FILE.Path(uri.file).extension;
        throw new PackageDescriptorError("Guess archive type for extension: " + ext);
    }
    var url = uri.url;
    url = url.replace(/\{rev\}/g, rev);
    return {
        "type": type,
        "url": url,
        "path": repository.path || null
    }
}


exports.validate = function(descriptor, options) {
    
    var valid = true,
        feedback = [];
    
    // repositories
    if(options.revisionControl) {
        if(!descriptor.repositories) {
            if(options.revisionControl.getRepositories()) {
                valid = false;
                options.print("\0red(No 'repositories' property found. Possible candidates: "+options.revisionControl.getRepositories()+"\0)");
            }
        } else {
            var repositoryValid = false,
                index = -1;
            descriptor.repositories.forEach(function(repository) {
                index++;
                if(!repository.type) {
                    feedback.push("Missing 'repositories["+index+"].type' property");
                    return;
                }
                if(repository.type!=options.revisionControl.getType()) {
                    feedback.push("'repositories["+index+"].type' property does not match: " + options.revisionControl.getType());
                    return;
                }
                if(!repository.url) {
                    feedback.push("Missing 'repositories["+index+"].url' property");
                    return;
                }
                if(!VENDOR.validateRepositoryUrl(repository.url, options)) {
                    feedback.push("'repositories["+index+"].url' property ("+repository.url+") does not match: " + options.revisionControl.getRepositories());
                    return;
                }
                if(options.revisionControl.getPathPrefix().valueOf()!="") {
                    if(!repository.path) {
                        feedback.push("Missing 'repositories["+index+"].path' property");
                        return;
                    }
                    if(options.revisionControl.getPathPrefix()!=repository.path) {
                        feedback.push("'repositories['+index+'].path' property does not match: " + options.revisionControl.getPathPrefix());
                        return;
                    }
                } else
                if(repository.path) {
                    feedback.push("Superfluous 'repositories["+index+"].path' property");
                    return;
                }
                repositoryValid = true;
            });
            if(!repositoryValid) {
                valid = false;
                options.print("\0red(No item in 'repositories' property matches actual environment.\0)");
                if(feedback.length>0) {
                    feedback.forEach(function(msg) {
                        options.print("\0yellow(  Feedback: "+msg+"\0)");
                    });
                }
            }
        }
    }

    if(!valid) {
        if(options.path) options.print("\0cyan(Package descriptor file: " + options.path.valueOf() + "\0)");
        options.print("\0cyan(Specification: http://wiki.commonjs.org/wiki/Packages/1.0\0)");
    }
    return valid;
}


var PackageDescriptorError = exports.PackageDescriptorError = function(message) {
    this.name = "PackageDescriptorError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PackageDescriptorError.prototype = new Error();

