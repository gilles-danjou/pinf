

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var DB = require("google/appengine/ext/db");
var USER = require("./user");
var OWNER = require("./owner");


var model = new DB.Model("Namespace", {
    "user": new DB.ReferenceProperty({
        referenceClass: USER.getModel()
    }),
    "owner": new DB.ReferenceProperty({
        referenceClass: OWNER.getModel()
    })
});

exports.getModel = function() {
    return model;
}

var Namespace = exports.Namespace = function(namespace) {
    if (!(this instanceof exports.Namespace))
        return new exports.Namespace(namespace);

    this.id = namespace;

    this.fetch();
}

Namespace.prototype.fetch = function() {
    this.data = model.getByKeyName(this.id);
}

Namespace.prototype.store = function() {
    this.data.put();
}

Namespace.prototype.exists = function() {
    if(!this.data || !this.data.user) return false;
    return true;
}

Namespace.prototype.verified = function() {
    if(!this.exists()) return false;
    if(!this.data.user || !this.data.owner) return false;
    var user = USER.User(this.data.user.datastoreKey().getName());
    var owner = OWNER.Owner(user, this.data.owner.datastoreKey().getName());
    if(!owner.verified()) return false;
    return true;
}

Namespace.prototype.register = function(user, owner) {

    if(!user.verified()) {
        throw new Error("User not verified");
    }

    if(!owner.verified()) {
        throw new Error("Owner not verified");
    }

    this.data = new model({
        "keyName": this.id,
        "user": user.data,
        "owner": owner.data
    });
    this.store();
}


