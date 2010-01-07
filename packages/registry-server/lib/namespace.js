

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var DB = require("google/appengine/ext/db");

var Namespace = exports.Namespace = function(user, owner, namespace) {
    if (!(this instanceof exports.Namespace))
        return new exports.Namespace(user, owner, namespace);

    if(!user.verified()) {
        throw new Error("User not verified");
    }

    if(!owner.verified()) {
        throw new Error("Owner not verified");
    }

    this.user = user;
    this.owner = owner;
    this.id = namespace;

    this.model = new DB.Model("Namespace", {
        "user":new DB.ReferenceProperty({referenceClass: user.model}),
        "owner":new DB.ReferenceProperty({referenceClass: owner.model})
    });
    
    this.fetch();
}

Namespace.prototype.fetch = function() {
    this.data = this.model.getByKeyName(this.id);
}

Namespace.prototype.store = function() {
    this.data.put();
}

Namespace.prototype.exists = function() {
    if(!this.data || !this.data.user) return false;
    return true;
}

Namespace.prototype.register = function() {
    this.data = new this.model({
        "keyName": this.id,
        "user": this.user.data,
        "owner": this.owner.data
    });
    this.store();
}


