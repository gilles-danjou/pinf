

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var DB = require("google/appengine/ext/db");
var EMAIL = require("google/appengine/api/mail");
var UUID = require("uuid", "util");
var MODELS = require("./models");

var model = MODELS.getModel("User");
exports.getModel = function() {
    return model;
}


var User = exports.User = function(email) {
    if (!(this instanceof exports.User))
        return new exports.User(email);

    this.id = email;
    
    this.fetch();
}

User.prototype.fetch = function() {
    this.data = model.getByKeyName(this.id);
}

User.prototype.store = function() {
    this.data.put();
}

User.prototype.exists = function() {
    if(!this.data || !this.data.authkey) return false;
    return true;
}

User.prototype.verified = function() {
    if(!this.exists()) return false;
    return this.data.verified || false;
}

User.prototype.getEmail = function() {
    return this.id;
}

User.prototype.getAuthKey = function() {
    if(!this.exists()) return null;
    return this.data.authkey || null;
}

User.prototype.sendAuthKey = function() {
    if(this.verified()) return false;
    var authkey = UUID.uuid();
    this.data = new model({
        "keyName": this.id,
        "authkey": authkey,
        "verified": false
    });
    this.store();
    var email = new EMAIL.EmailMessage({
        "sender": '"PINF Registry Server" <registry-server@pinf.org>',
        "to": '"' + this.getEmail() + '" <' + this.getEmail() + '>',
        "subject": "User Registration Email",
        body: "Your access code is: " + authkey + "\n\nTo confirm your account run:\n\n  pinf register-namespace --authkey " + authkey + " <URL>\n\nYou do not need to include --authkey in subsequent commands."
    }).send();
    return true;
}

User.prototype.validateAuthKey = function(authkey) {
    if(!this.exists() || this.getAuthKey()!=authkey) {
        return false;
    }
    this.data.verified = true;
    this.store();
    return true;
}


exports.authorize = function(request) {

    var user = User(request.user);

    request.user = user;

    if(request.authkey=="__REQUEST__") {

        if(user.verified()) {
            return {
                "status": "USER_ALREADY_REGISTERED",
                "message": "A user with the same email address has already been registered."
            }
        }
        
        user.sendAuthKey();

        // HACK: For non-production testing only
        if(request.env.environment=="development" && user.getEmail()=="test@pinf.org") {
            user.validateAuthKey(user.getAuthKey());
            return {
                "status": "AUTHORIZED"
            };
        }

        return {
            "status": "AUTH_KEY_EMAIL_SENT",
            "message": "Sent authorization email to: " + user.getEmail()
        }
    }
    
    if(!user.verified()) {
        if(!user.validateAuthKey(request.authkey)) {
            return {
                "status": "INVALID_AUTH_KEY",
                "message": "Invalid authorization key for user: " + user.getEmail()
            }
        }
    }
    
    if(request.authkey!=user.getAuthKey()) {
        return {
            "status": "UNAUTHORIZED_USER",
            "message": "User is not authorized to access this service"
        };
    }
        
    return {
        "status": "AUTHORIZED"
    };
}
