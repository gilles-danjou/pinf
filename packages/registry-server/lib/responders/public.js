
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var PACKAGE = require("../package");

exports.service = function(env) {
    
    
    var parts = env.PATH_INFO.match(/^\/([^\/]*)\/((.*?)\/([^\/]*)\/?)?$/);
    if(!parts) {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }

dump(parts);

    var info = {
        "owner": parts[1],
        "path": parts[3],
        "package": parts[4]
    }
dump(info);

    
    var id = info["owner"] + "/" + info["path"] + ":" + info["package"];
    
    var pkg = PACKAGE.Package(id);
    if(!pkg.exists()) {
        return {
            "status": "PACKAGE_NOT_FOUND",
            "message": "Package not found"
        };
    }
    

print(id);

    
    
    return "hello world";    

}