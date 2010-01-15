
var USER = require("../user");
var OWNER = require("../owner");
var NAMESPACE = require("../namespace");

exports.handle = function(request) {

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
    
    var owner = OWNER.Owner(request.user, request.owner);
    if(!owner.exists()) {
        owner.sendSecretKey();
        if(owner.verified()) {
            // email owner is already verified (as it is the same as the user email)
        } else {
            return {
                "status": "OWNER_VERIFY_EMAIL_SENT",
                "message": "Sent owner verification email to: " + request.user.getEmail()
            }
        }
    } else
    if(!owner.verified()) {
        // this is always a hostname owner since email owners are always already verified
        if(!owner.validateSecretKey()) {
            return {
                "status": "OWNER_VERIFY_FAILED",
                "message": "Owner verification failed for url: " + owner.url
            }
        }
    }

    var namespace = NAMESPACE.Namespace(request.namespace);
    if(namespace.exists()) {
        return {
            "status": "NAMESPACE_EXISTS",
            "message": "Namespace is already registered."
        }
    }
    namespace.register(request.user, owner);

    return {
        "status": "NAMESPACE_REGISTERED",
        "message": "Namespace has been registered.",
        "authkey": request.user.getAuthKey()
    };    
}