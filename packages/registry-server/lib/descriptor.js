

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var DB = require("google/appengine/ext/db");

var model = new DB.Model("Descriptor", {
    "revisions": new DB.StringProperty(),
    "versions": new DB.StringProperty()
});

exports.getModel = function() {
    return model;
}

var Descriptor = exports.Descriptor = function(id) {
    if (!(this instanceof exports.Descriptor))
        return new exports.Descriptor(id);

    this.id = id;

    this.fetch();
}

Descriptor.prototype.fetch = function() {
    this.data = model.getByKeyName(this.id);
    if(!this.exists()) {
        this.data = new model({
            "keyName": this.id
        });
    }
    if(this.data.revisions) {
        this.revisions = JSON.decode(this.data.revisions);
    }
    if(this.data.versions) {
        this.versions = JSON.decode(this.data.versions);
    }
}

Descriptor.prototype.store = function() {
    if(this.revisions) {
        this.data.revisions = JSON.encode(this.revisions);
    }
    if(this.versions) {
        this.data.versions = JSON.encode(this.versions);
    }
    this.data.put();
}

Descriptor.prototype.exists = function() {
    if(!this.data || (!this.data.revisions && !this.data.versions)) return false;
    return true;
}

Descriptor.prototype.getForRevision = function(revision) {
    if(!this.revisions) return false;
    if(!this.revisions[revision]) return false;
    return this.revisions[revision];
}

Descriptor.prototype.getForVersion = function(version) {
    if(!this.versions) return false;
    if(!this.versions[version]) return false;
    return this.versions[version];
}

Descriptor.prototype.setForRevision = function(revision, data, keepRevisions) {
    if(!this.revisions) {
        this.revisions = {};
    }
    var revisions = {},
        self = this;
    keepRevisions.forEach(function(keepRevision) {
        if(self.revisions[keepRevision]) {
            revisions[keepRevision] = self.revisions[keepRevision];
        }
    });
    revisions[revision] = data;
    this.revisions = revisions;
    this.store();
}

Descriptor.prototype.setForVersion = function(version, data, keepVersions) {
    if(!this.versions) {
        this.versions = {};
    }
    var versions = {},
        self = this;
    keepVersions.forEach(function(keepVersion) {
        if(self.versions[keepVersion]) {
            versions[keepVersion] = self.versions[keepVersion];
        }
    });
    versions[version] = data;
    this.versions = versions;
    this.store();
}
