
var USER = require("../user");
var OWNER = require("../owner");
var NAMESPACE = require("../namespace");

exports.handle = function(request) {
    
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

    var namespace = NAMESPACE.Namespace(request.user, owner, request.namespace);
    if(namespace.exists()) {
        return {
            "status": "NAMESPACE_EXISTS",
            "message": "Namespace is already registered."
        }
    }
    namespace.register();

    return {
        "status": "NAMESPACE_REGISTERED",
        "message": "Namespace has been registered.",
        "authkey": request.user.getAuthKey()
    };    
}