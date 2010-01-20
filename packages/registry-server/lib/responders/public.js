
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var DB = require("google/appengine/ext/db");
var CACHE = require("../cache");
var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");
var MODELS = require("../models");
var JSON = require("json");
var FILE = require("file");

exports.service = function(env) {    

    var parts = env.PATH_INFO.match(/^\/([^\/]*)\/(.*?)(\/([^\/]*)\/?)?$/);

    if(!parts) {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }

    var info = {
            "owner": parts[1],
            "path": (parts[4])?parts[2]:null,
            "package": (parts[4])?parts[4]:parts[2]
        },
        id;

    if(!info.owner || !info["package"]) {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }
    
    if(info["package"] && info["package"].substr(info["package"].length-12, 12)!="catalog.json") {
        id = info["owner"] + ((info["path"])?"/" + info["path"]:"") + ":" + info["package"];
        return PACKAGE.serviceInfoForId(id);
    } else {
        id = info["owner"] + ((info["path"])?"/" + info["path"]:"");
    }
    
    return NAMESPACE.serviceCatalogForId(env, id);

}