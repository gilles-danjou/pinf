
var DB = require("google/appengine/ext/db");

var models = {};

models["User"] = new DB.Model("User", {
    "created": new DB.DateTimeProperty({"autoNowAdd": true}),
    "updated": new DB.DateTimeProperty({"autoNow": true}),
    "authkey": new DB.StringProperty(),
    "verified": new DB.BooleanProperty()
});

models["Owner"] = new DB.Model("Owner", {
    "created": new DB.DateTimeProperty({"autoNowAdd": true}),
    "updated": new DB.DateTimeProperty({"autoNow": true}),
    "user":new DB.ReferenceProperty({
        referenceClass: models["User"]
    }),
    "secret": new DB.StringProperty(),
    "verified": new DB.BooleanProperty()
});

models["Namespace"] = new DB.Model("Namespace", {
    "created": new DB.DateTimeProperty({"autoNowAdd": true}),
    "updated": new DB.DateTimeProperty({"autoNow": true}),
    "user": new DB.ReferenceProperty({
        referenceClass: models["User"]
    }),
    "owner": new DB.ReferenceProperty({
        referenceClass: models["Owner"]
    })
});

models["Package"] = new DB.Model("Package", {
    "created": new DB.DateTimeProperty({"autoNowAdd": true}),
    "updated": new DB.DateTimeProperty({"autoNow": true}),
    "namespace": new DB.ReferenceProperty({
        referenceClass: models["Namespace"]
    }),
    "versions": new DB.TextProperty(),
    "revisions": new DB.TextProperty(),
    "descriptors": new DB.TextProperty()
});

models["Announcement"] = new DB.Model("Announcement", {
    "created": new DB.DateTimeProperty({"autoNowAdd": true}),
    "package": new DB.ReferenceProperty({
        referenceClass: models["Package"]
    }),
    "version": new DB.StringProperty(),
    "revision": new DB.StringProperty()
});

exports.getModel = function(name) {
    return models[name];
}
