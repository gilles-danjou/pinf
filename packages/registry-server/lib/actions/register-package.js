
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

        pkg = PACKAGE.Package(namespace.id + ":" + sourcePkg.getName());
        if(pkg.exists()) {
            return {
                "status": "PACKAGE_EXISTS",
                "message": "Package already registered for namespace."
            }
        }

        pkg.register(namespace, sourcePkg);

    } else {

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