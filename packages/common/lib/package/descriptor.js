

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var VALIDATOR = require("validator", "util");
var SEMVER = require("semver", "util");
var LOCATOR = require("./locator");


var PackageDescriptor = exports.PackageDescriptor = function(path) {
    if (!(this instanceof exports.PackageDescriptor))
        return new exports.PackageDescriptor(path);
        
    if(path instanceof FILE.Path) {
        this.path = path;
    
        if(!path.exists()) {
            throw new Error("No package descriptor found at: " + path);
        }
        this.spec = JSON.decode(path.read());
    } else {
        this.spec = path;
    }
    
    if(!this.spec) {
        throw new Error("Error parsing package descriptor"+(this.path)?" at: " + this.path:"");
    }
    if(!this.spec.name) {
        throw new Error("No 'name' property in package descriptor"+(this.path)?" at: " + this.path:"");
    }
}

PackageDescriptor.prototype.save = function() {
    if(!this.path) {
        throw new Error("Cannot save package descriptor");
    }
    this.path.write(JSON.encode(this.spec, null, "    "));
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

PackageDescriptor.prototype.getTopLevelId = function() {

}

PackageDescriptor.prototype.hasUid = function() {
    if(!this.spec.uid) return false;
    return true;
}

PackageDescriptor.prototype.getUid = function() {
    if(!this.spec.uid) {
        throw new Error("No 'uid' property in package descriptor"+(this.path)?" at: " + this.path:"");
    }
    var uri = VALIDATOR.validate("url", this.spec.uid, {
        "require": [
            ["path", {"trailingSlash": true}]
        ],
        "return": "uri"
    });
    if(uri.directories[uri.directories.length-1]!=this.spec.name) {
        throw new Error("The 'uid' property does not have the 'name' property at the end of the URI in package descriptor"+(this.path)?" at: " + this.path:"");
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
    options.path = this.path || null;
    return exports.validate(this.spec, options);
}

PackageDescriptor.prototype.getCompletedSpec = function() {
    
    var descriptor = UTIL.copy(this.spec);
    
    // repositories
    if(descriptor.repositories) {
        descriptor.repositories.forEach(function(repository) {
            if(!repository.raw) {
                var url = rawUrlForRepository(repository);
                if(url) {
                    repository.raw = url;
                }
                var info = downloadInfoForRepository(repository);
                if(info) {
                    repository.download = info;
                }
            }
        });
    }
    
    return descriptor;
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

PackageDescriptor.prototype.traverseEveryUsing = function(callback, options, visited, stacks) {
    if(!options || !options.packageStore) {
        throw new Error("options.packageStore not provided");
    }
    if(!options || !options["package"]) {
        throw new Error("options.package not provided");
    }
    if(!this.spec.using) {
        return false;
    }
    visited = visited || {};
    stacks = stacks || {"names": []};
    if(visited[this.getUid()]) {
        return false;
    }
    var locator,
        self = this,
        itemOptions = UTIL.copy(options);
    UTIL.every(this.spec.using, function(item) {
        locator = LOCATOR.PackageLocator(item[1]);
        locator = callback(options["package"], item[0], locator, stacks) || locator;
        visited[self.getUid()] = true;
        itemOptions["package"] = options.packageStore.get(locator);
        stacks.names.push(item[0]);
        itemOptions["package"].getDescriptor().traverseEveryUsing(callback, itemOptions, visited, stacks);
        stacks.names.pop();
    });
    return true;
}

PackageDescriptor.prototype.getDownloadInfo = function() {
    if(!this.spec.repositories) {
        throw new Error("No 'repositories' property");
    }
    // TODO: Option to use alternate repositories instead of just repositories[0]
    var repository = this.spec.repositories[0];
    if(!repository.download) {
        throw new Error("No 'repositories[0].download' property");
    }
    if(!repository.download.url) {
        throw new Error("No 'repositories[0].download.url' property");
    }
    var uri = URI.parse(repository.download.url),
        rev,
        type = repository.download.type || false,
        version = this.spec.version,
        m;
    if(SEMVER.validate(version, {"numericOnly": true})) {
        rev = "v" + version;
    } else
    if(m = version.match(/^0\.0\.0rev-(.*)$/)) {
        rev = m[1];
    } else {
        rev = "v" + version;
    }
    if(!type) {
        if(!uri.file) {
            throw new Error("Cannot guess archive type. No 'file' component in download url.");
        }
        var ext = FILE.Path(uri.file).extension;
        throw new Error("Guess archive type for extension: " + ext);
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
                if(!validateRepositoryUrl(repository.url, options)) {
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

function validateRepositoryUrl(url, options) {
    var repositories = options.revisionControl.getRepositories();
    if(!repositories) {
        return false;
    }
    var urlInfo = normalizeRepositoryUrl(url),
        valid = false;
    repositories.forEach(function(repository) {
        if(valid) return;
        var repositoryInfo = normalizeRepositoryUrl(repository);
        if(compareRepositoryUrlInfo(urlInfo, repositoryInfo, ["private"])) {
            valid = true;
        }
    });
    return valid;
}

function normalizeRepositoryUrl(url) {
    var info = {},
        m;
    
    if(m = url.match(/^git:\/\/([^\/]*)\/(.*?).git$/)) {
        info.type = "git";
        info["private"] = false;
        info.host = m[1];
        info.path = m[2];
    } else
    if(m = url.match(/^git@([^:]*):(.*?).git$/)) {
        info.type = "git";
        info["private"] = true;
        info.host = m[1];
        info.path = m[2];
    }    
    return info;
}

function compareRepositoryUrlInfo(subject, compare, ignore) {
    subject = UTIL.copy(subject);
    compare = UTIL.copy(compare);
    ignore = ignore || [];
    ignore.forEach(function(name) {
        if(UTIL.has(subject, ignore)) delete subject[ignore];
        if(UTIL.has(compare, ignore)) delete compare[ignore];
    });
    return UTIL.eq(subject, compare);
}

function rawUrlForRepository(repository) {
    
    var repositoryInfo = normalizeRepositoryUrl(repository.url);
    
    if(repositoryInfo.host=="github.com") {
        return "http://github.com/" + repositoryInfo.path + "/raw/{rev}/" + ((repository.path)?repository.path+"/":"") + "{path}";
    }
    
    return false;
}


function downloadInfoForRepository(repository) {
    
    var repositoryInfo = normalizeRepositoryUrl(repository.url);
    
    if(repositoryInfo.host=="github.com") {
        return {
            "type": "zip",
            "url": "http://github.com/" + repositoryInfo.path + "/zipball/{rev}/"
        }
    }
    
    return false;
}

