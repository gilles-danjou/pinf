
var DB = require("google/appengine/ext/db");

var models = {};

models["User"] = new DB.Model("User", {
    "authkey": new DB.StringProperty(),
    "verified": new DB.BooleanProperty()
});

models["Owner"] = new DB.Model("Owner", {
    "user":new DB.ReferenceProperty({
        referenceClass: models["User"]
    }),
    "secret": new DB.StringProperty(),
    "verified": new DB.BooleanProperty()
});

models["Namespace"] = new DB.Model("Namespace", {
    "user": new DB.ReferenceProperty({
        referenceClass: models["User"]
    }),
    "owner": new DB.ReferenceProperty({
        referenceClass: models["Owner"]
    })
});

models["Package"] = new DB.Model("Package", {
    "namespace": new DB.ReferenceProperty({
        referenceClass: models["Namespace"]
    }),
    "versions": new DB.StringProperty(),
    "revisions": new DB.StringProperty(),
    "descriptors": new DB.StringProperty()
});

models["Announcement"] = new DB.Model("Announcement", {
    "triggered": new DB.DateTimeProperty({"autoNowAdd": true}),
    "package": new DB.ReferenceProperty({
        referenceClass: models["Package"]
    }),
    "version": new DB.StringProperty(),
    "revision": new DB.StringProperty()
});

exports.getModel = function(name) {
    return models[name];
}
