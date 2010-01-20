
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var DB = require("google/appengine/ext/db");
var CACHE = require("../cache");
var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");
var MODELS = require("../models");
var JSON = require("json");
var FILE = require("file");

exports.service = function(env) {
    
    if(env.PATH_INFO=="/@feeds/announcements.json") {
        
        var memcachedKey = "uri:/feeds/announcements.json";
        var announcements = CACHE.get(memcachedKey);
        if(!announcements) {
            var since = new java.util.Date(new Date().getTime() - 60*5*1000);   // 5 minutes
            announcements = {
                "since": ""+since,
                "announcements": []
            };
    
            var model = MODELS.getModel("Announcement");
            var result = model.all().filter("created >=", since).
                            order("created").fetch();
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
                        "created": ""+event.created,
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
            CACHE.set(memcachedKey, JSON.encode(announcements, null, "  "), 60);  // 1 minute
        }
        return announcements;
    }
}