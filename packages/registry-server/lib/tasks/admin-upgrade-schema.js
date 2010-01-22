
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var PACKAGE = require("../package");
var MODELS = require("../models");
var QUERYSTRING = require("jack/querystring");
var TASKQUEUE = require("google/appengine/api/labs/taskqueue");
var JSON = require("json");


exports.service = function(env) {

    var qs = QUERYSTRING.parseQuery(env.QUERY_STRING),
        offset = parseInt(qs.offset) || 0,
        limit = 10;

    var result = MODELS.getModel("Package").all().limit(limit).offset(offset).fetch();
    if(!result || result.length==0) return "OK";
    
    result.forEach(function(data) {
        
        pkg = PACKAGE.Package(data.datastoreKey().getName(), data);
        
        if(!data.descriptor) {
            
            var rev = pkg.getLastRevision("master");
            if(rev) {

                var descriptor = pkg.descriptors.revisions[rev];
    
                pkg.data.descriptor = JSON.encode(descriptor);
    
    print("update desc pkg: "+pkg.id);
    
                pkg.store();
            }
        } else
        if(!data.repositories && data.descriptor) {

print("update reps pkg: "+pkg.id);

            pkg.store();
        }
    });

    offset += limit;

    TASKQUEUE.add({
        "url": "/.tasks/admin-upgrade-schema",
        "method": "GET",
        "params": {
            "offset": offset
        }
    });

    return "OK";
}
