
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var MEMCACHED = require("google/appengine/api/memcache");
var NAMESPACE = require("../namespace");
var PACKAGE = require("../package");


exports.service = function(env) {

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
    
    if(info["package"]) {
        id = info["owner"] + "/" + info["path"] + ":" + info["package"];
        var pkg = PACKAGE.Package(id);
        if(pkg.exists()) {
            return pkg.getInfo();
        }
        id = info["owner"] + "/" + info["path"] + "/" + info["package"];
    } else {
        id = info["owner"] + "/" + info["path"];
    }
    
    var namespace = NAMESPACE.Namespace(id);
    if(!namespace.exists()) {
        return {
            "status": "404",
            "message": "Namespace not found"
        };
    }
    
    return namespace.getCatalog();

    /*
var fragment = MEMCACHED.get("fragment");
if (!fragment) {
    ...
    MEMCACHED.set("fragment", fragment);
}
    */
}