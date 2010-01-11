
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");


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

    var pkg = PACKAGE.Package(namespace.id + ":" + request.args["package"]);
    if(pkg.exists()) {
        return {
            "status": "PACKAGE_EXISTS",
            "message": "Package already registered for namespace."
        }
    }
    
    pkg.register(namespace);
    
    return {
        "status": "PACKAGE_REGISTERED",
        "message": "Package has been registered.",
        "uid": pkg.getUid(request.env)
    };    
}