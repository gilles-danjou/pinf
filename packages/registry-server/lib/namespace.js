

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var DB = require("google/appengine/ext/db");
var USER = require("./user");
var OWNER = require("./owner");
var SEMVER = require("semver", "util");
var MODELS = require("./models");
var CACHE = require("./cache");

var model = MODELS.getModel("Namespace");
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
    CACHE.remove("namespace:" + this.id);
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

Namespace.prototype.getCatalog = function(env) {

    var url = [
        "http://"
    ];
    url.push(env.SERVER_NAME);
    if(env.SERVER_PORT && env.SERVER_PORT!="80") {
        url.push(":" + env.SERVER_PORT);
    }
    url.push("/" + this.id + "/");
    url.push("catalog.json");

    var catalog = {
        "uid": url.join(""),
        "packages": {}
    };
    
    var packages = require("./package").getForNamespace(this);
    if(packages) {
        UTIL.every(packages, function(pkg) {
            catalog.packages[pkg[1].getName()] = {};
            if(pkg[1].revisions) {
                UTIL.every(pkg[1].revisions, function(revision) {
                    catalog.packages[pkg[1].getName()][revision[0]] = pkg[1].getDescriptorForRevision(revision[1]);
                });
            }
            if(pkg[1].versions) {
                pkg[1].versions.forEach(function(version) {
                    catalog.packages[pkg[1].getName()][SEMVER.getMajor(version)] = pkg[1].getDescriptorForVersion(version);
                });
            }
            if(UTIL.len(catalog.packages[pkg[1].getName()])==0) {
                delete catalog.packages[pkg[1].getName()];
            }
        });
    }
    return catalog;
}

exports.serviceCatalogForId = function(env, id) {
    var key = "namespace:"+id,
        data = CACHE.get(key);
    if(!data) {
        var namespace = Namespace(id);
        if(!namespace.exists()) {
            return {
                "status": "404",
                "message": "Namespace not found"
            };
        }
        data = namespace.getCatalog(env);
        CACHE.set(key, JSON.encode(data, null, "  "));
    }
    return data;    
}
