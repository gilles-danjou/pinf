

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var VALIDATOR = require("validator", "util");
var DB = require("google/appengine/ext/db");
var FETCH = require("google/appengine/api/urlfetch");
var EMAIL = require("google/appengine/api/mail");
var UUID = require("uuid", "util");

var Owner = exports.Owner = function(user, owner) {
    if (!(this instanceof exports.Owner))
        return new exports.Owner(user, owner);

    if(!user.verified()) {
        throw new Error("User not verified");
    }

    this.user = user;
    this.id = owner;
    this.type = (VALIDATOR.validate("email", owner, {"throw": false}))?"email":"hostname",
    this.url = "http://" + this.getOwner() + "/pinf-ownership-key";

    this.model = new DB.Model("Owner", {
        "user":new DB.ReferenceProperty({referenceClass: user.model}),
        "secret": new DB.StringProperty(),
        "verified": new DB.BooleanProperty()
    });
    
    this.fetch();
}

Owner.prototype.fetch = function() {
    this.data = this.model.getByKeyName(this.id);
}

Owner.prototype.store = function() {
    this.data.put();
}

Owner.prototype.exists = function() {
    if(!this.data || !this.data.user) return false;
    return true;
}

Owner.prototype.verified = function() {
    if(!this.exists()) return false;
    return this.data.verified || false;
}

Owner.prototype.getSecretKey = function() {
    if(!this.exists()) return null;
    return this.data.secret || null;
}

Owner.prototype.getOwner = function() {
    return this.id;
}

Owner.prototype.getType = function() {
    return this.type;
}

Owner.prototype.sendSecretKey = function() {
    if(this.type=="email" && this.user.getEmail()==this.id) {
        this.data = new this.model({
            "keyName": this.id,
            "user": this.user.data,
            "secret": "",
            "verified": true
        });
        this.store();
    } else {
        var secret = UUID.uuid();
        this.data = new this.model({
            "keyName": this.id,
            "user": this.user.data,
            "secret": secret,
            "verified": false
        });
        this.store();
        var email = new EMAIL.EmailMessage({
            sender: '"PINF Registry Server" <registry-server@pinf.org>',
            to: this.user.getEmail(),
            subject: "Owner Registration Email",
            body: "Place this '" + secret + "' into a file at '"+ this.url +"'.\n\nTo confirm your ownership re-run:\n\n  pinf register-namespace --user <User> <URL>"
        }).send();
    }
}

Owner.prototype.validateSecretKey = function() {
    if(!this.exists()) {
        return false;
    }
    try {
        var response = FETCH.fetch(this.url),
            text = UTIL.trim(response.content.decodeToString("UTF-8"));
        if(this.getSecretKey()!=text) {
            return false;
        }
    } catch(e) {}
    this.data.verified = true;
    this.store();
    return true;
}

