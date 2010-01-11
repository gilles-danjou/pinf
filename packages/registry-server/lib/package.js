

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var DB = require("google/appengine/ext/db");
var NAMESPACE = require("./namespace");
var SEMVER = require("semver", "util");
var JSON = require("json");


var model = new DB.Model("Package", {
    "namespace": new DB.ReferenceProperty({
        referenceClass: NAMESPACE.getModel()
    }),
    "versions": new DB.StringProperty(),
    "revisions": new DB.StringProperty()
});

exports.getModel = function() {
    return model;
}


var Package = exports.Package = function(pkg) {
    if (!(this instanceof exports.Package))
        return new exports.Package(pkg);

    this.id = pkg;

    this.fetch();
}

Package.prototype.fetch = function() {
    this.data = model.getByKeyName(this.id);
}

Package.prototype.store = function() {
    this.data.put();
}

Package.prototype.exists = function() {
    if(!this.data || !this.data.namespace) return false;
    return true;
}

Package.prototype.getName = function() {
    return this.id.split(":").pop();
}

Package.prototype.getNamespace = function() {
    if(!this.exists()) return null;
    return this.data.namespace.datastoreKey().getName();
}

Package.prototype.getLatestVersion = function(version) {
    if(!this.data || !this.data.versions) return false;
    return SEMVER.latestForMajor(JSON.decode(this.data.versions), version);
}

Package.prototype.announceVersion = function(version) {
    if(!this.data.versions) {
        this.data.versions = [version];
    } else {
        this.data.versions = JSON.decode(this.data.versions);
        this.data.versions.push(version);
        this.data.versions = SEMVER.latestForEachMajor(this.data.versions);
    }
    this.data.versions = JSON.encode(this.data.versions);
    this.store();
}

Package.prototype.getLastRevision = function(branch) {
    if(!this.data || !this.data.revisions) return false;
    var revisions = JSON.decode(this.data.revisions);
    if(!revisions[branch]) return false;
    return revisions[branch];
}

Package.prototype.announceRevision = function(branch, revision) {
    if(!this.data.revisions) {
        this.data.revisions = {};
    } else {
        this.data.revisions = JSON.decode(this.data.revisions);
    }
    this.data.revisions[branch] = revision;
    this.data.revisions = JSON.encode(this.data.revisions);
    this.store();
}

Package.prototype.getUid = function(env) {
    var url = [
        "http://"
    ];
    url.push(env.SERVER_NAME);
    if(env.SERVER_PORT && env.SERVER_PORT!="80") {
        url.push(":" + env.SERVER_PORT);
    }
    url.push("/" + this.getNamespace() + "/");
    url.push(this.getName() + "/");
    
    return url.join("");
}

Package.prototype.register = function(namespace) {
    this.data = new model({
        "keyName": this.id,
        "namespace": namespace.data
    });
    this.store();
}
