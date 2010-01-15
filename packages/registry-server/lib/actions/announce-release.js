
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");
var SEMVER = require("semver", "util");


exports.handle = function(request) {
    
    if(!request.args["package"]) {
        return {
            "status": "WRONG_ARGUMENTS",
            "message": "Wrong arguments: 'package' is missing."
        }
    }

    if(!/^[a-z0-9-_\.]*$/.test(request.args["package"])) {
        return {
            "status": "WRONG_ARGUMENT_FORMAT",
            "message": "Wrong argument format: 'package' does not match [a-z0-9-_\.]."
        }
    }

    if(request.args["package"].length>100) {
        return {
            "status": "WRONG_ARGUMENT_FORMAT",
            "message": "Wrong argument format: 'package' is longer than 50 characters."
        }
    }

    if(!request.args["descriptor"]) {
        return {
            "status": "WRONG_ARGUMENTS",
            "message": "Wrong arguments: 'descriptor' is missing."
        }
    }
    
    // TODO: Validate descriptor
    
    var namespace = NAMESPACE.Namespace(request.namespace);
    if(!namespace.verified()) {
        return {
            "status": "NAMESPACE_NOT_VERIFIED",
            "message": "Namespace is not verified."
        }
    }

    var pkg = PACKAGE.Package(namespace.id + ":" + request.args["package"]);
    if(!pkg.exists()) {
        return {
            "status": "PACKAGE_NOT_REGISTERED",
            "message": "Package is not registered for namespace."
        }
    }
    
    if(request.args["version"]) {
        if(!SEMVER.validate(request.args["version"])) {
            return {
                "status": "INVALID_VERSION",
                "message": "The version format is invalid."
            }
        }
        var latestVersion = pkg.getLatestVersion(request.args["version"]);
        if(latestVersion==request.args["version"]) {
            return {
                "status": "RELEASE_ALREADY_ANNOUNCED",
                "message": "The package release has already been announced."
            }
        }
        pkg.announceVersion(request.args["version"], request.args["descriptor"]);
    } else
    if(request.args["branch"] && request.args["revision"]) {
        var lastRevision = pkg.getLastRevision(request.args["branch"]);
        if(lastRevision==request.args["revision"]) {
            return {
                "status": "RELEASE_ALREADY_ANNOUNCED",
                "message": "The package release has already been announced."
            }
        }
        pkg.announceRevision(request.args["branch"], request.args["revision"], request.args["descriptor"]);
    } else {
        return {
            "status": "WRONG_ARGUMENTS",
            "message": "Wrong arguments: 'tag' or 'branch' + 'revision' is missing."
        }
    }

    return {
        "status": "RELEASE_ANNOUNCED",
        "message": "A new package release has been announced."
    };
}