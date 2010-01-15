
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");
var VALIDATOR = require("validator", "util");


exports.handle = function(request) {
    
    if(!request.args["package"]) {
        return {
            "status": "WRONG_ARGUMENTS",
            "message": "Wrong arguments: 'package' is missing."
        }
    }

    if(!request.namespace) {
        return {
            "status": "WRONG_ARGUMENTS",
            "message": "Wrong arguments: 'namespace' is missing."
        }
    }

    if(!/^[a-z0-9-_\.@\/]*$/.test(request.namespace)) {
        return {
            "status": "WRONG_ARGUMENT_FORMAT",
            "message": "Wrong argument format: 'namespace' does not match [a-z0-9-_\.@\/]."
        }
    }

    if(request.namespace.length>100) {
        return {
            "status": "WRONG_ARGUMENT_FORMAT",
            "message": "Wrong argument format: 'namespace' is longer than 100 characters."
        }
    }

    
    var namespace = NAMESPACE.Namespace(request.namespace);
    if(!namespace.verified()) {
        return {
            "status": "NAMESPACE_NOT_VERIFIED",
            "message": "Namespace is not verified."
        }
    }
    
    var pkg;

    if(VALIDATOR.validate("url", request.args["package"], {"throw": false})!==false) {

        if(request.args["package"].substr(0,request.baseUrl.length)!=request.baseUrl) {
            // TODO: Allow external registry server URLs
            return {
                "status": "INVALID_PACKAGE_UID",
                "message": "Package UID is not a pinf URL from the same registry server: " + request.baseUrl + "..."
            }
        }
        
        var id = VALIDATOR.validate("path", request.args["package"].substr(request.baseUrl.length), {
            "dropTrailingSlash": true
        }).split("/");
        id = id.slice(0,id.length-1).join("/") + ":" + id.pop();

        var sourcePkg = PACKAGE.Package(id);
        if(!sourcePkg.exists()) {
            return {
                "status": "SOURCE_PACKAGE_DOES_NOT_EXIST",
                "message": "Source package does not exist."
            }
        }
        if(sourcePkg.data.source) {
            return {
                "status": "SOURCE_PACKAGE_NOT_HARD",
                "message": "Source package is not a hard package (it is a source package itself)."
            }
        }
        
        pkg = PACKAGE.Package(namespace.id + ":" + (request.args["name"] || sourcePkg.getName()));
        if(pkg.exists()) {
            return {
                "status": "PACKAGE_EXISTS",
                "message": "Package already registered for namespace."
            }
        }

        pkg.register(namespace, sourcePkg);

    } else {

        if(!/^[a-z0-9-_\.]*$/.test(request.args["package"])) {
            return {
                "status": "WRONG_ARGUMENT_FORMAT",
                "message": "Wrong argument format: 'package' does not match [a-z0-9-_\.]."
            }
        }
    
        if(request.args["package"].length>50) {
            return {
                "status": "WRONG_ARGUMENT_FORMAT",
                "message": "Wrong argument format: 'package' is longer than 50 characters."
            }
        }

        if(request.args["name"]) {
            return {
                "status": "WRONG_ARGUMENTS",
                "message": "Wrong arguments: 'name' can only be used with UID URL for 'package'."
            }
        }

        pkg = PACKAGE.Package(namespace.id + ":" + request.args["package"]);
        if(pkg.exists()) {
            return {
                "status": "PACKAGE_EXISTS",
                "message": "Package already registered for namespace."
            }
        }
        
        pkg.register(namespace);
        
    }
    
    return {
        "status": "PACKAGE_REGISTERED",
        "message": "Package has been registered.",
        "uid": pkg.getUid(request.env)
    };    
}