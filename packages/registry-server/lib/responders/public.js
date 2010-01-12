
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var DB = require("google/appengine/ext/db");
var MEMCACHED = require("google/appengine/api/memcache");
var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");
var MODELS = require("../models");
var JSON = require("json");

exports.service = function(env) {
    
    if(env.PATH_INFO=="/feeds/announcements.json") {
        
        var memcachedKey = "uri:/feeds/announcements.json";
        var announcements = MEMCACHED.get(memcachedKey);
        if(!announcements) {
            var since = new java.util.Date(new Date().getTime() - 60*5*1000);   // 5 minutes
            announcements = {
                "since": ""+since,
                "announcements": []
            };
    
            var model = MODELS.getModel("Announcement");
            var result = model.all().filter("triggered >=", since).
                            order("triggered").fetch();
            if(result) {
    
                var url = [
                    "http://"
                ];
                url.push(env.SERVER_NAME);
                if(env.SERVER_PORT && env.SERVER_PORT!="80") {
                    url.push(":" + env.SERVER_PORT);
                }
                url = url.join("");
                
                result.forEach(function(event) {
                    var info = {
                        "time": ""+event.triggered,
                        "uid": url + "/" + (""+event["package"].datastoreKey().getName()).replace(/:/g, "/") + "/"
                    }
                    if(event.version) {
                        info.version = event.version;
                    }
                    if(event.revision) {
                        info.revision = event.revision;
                    }
                    announcements.announcements.push(info);
                });
            }
            MEMCACHED.set(memcachedKey, JSON.encode(announcements, null, "    "), 60);  // 1 minute
        }
        return announcements;
    }


    var parts = env.PATH_INFO.match(/^\/([^\/]*)\/((.*?)\/([^\/]*)\/?)?$/);
    if(!parts) {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }

    var info = {
            "owner": parts[1],
            "path": parts[3],
            "package": parts[4]
        },
        id;

    if(!info.owner || !info.path) {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }
    
    if(info["package"] && info["package"].substr(info["package"].length-12, 12)!="catalog.json") {
        id = info["owner"] + "/" + info["path"] + ":" + info["package"];
        return PACKAGE.serviceInfoForId(id);
    } else {
        id = info["owner"] + "/" + info["path"];
    }
    
    return NAMESPACE.serviceCatalogForId(env, id);
}