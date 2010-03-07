
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var FILE = require("file");
var UTIL = require("util");
var DESCRIPTOR = require("../package/descriptor");

exports.Pinf = function(app) {

    var routes = [];
    // collect all routing declarations
    if(require.loader.usingCatalog) {
        UTIL.every(require.loader.usingCatalog, function(entry) {
            try {
                var descriptor = DESCRIPTOR.PackageDescriptor(FILE.Path(""+entry[1].directory).join("package.json")),
                    impl = descriptor.getImplementsForUri("http://registry.pinf.org/cadorn.org/github/pinf/@meta/routing/path/0.1.0");
                if(impl && UTIL.has(impl, "mappings")) {
                    UTIL.every(impl.mappings, function(mapping) {
                        // we only map routes starting with "/" here
                        if(mapping[0].substr(0,1)!="/") return;
                        if(!UTIL.has(mapping[1], "type")) {
                            throw new Error("type not defined in pinf routing declaration in: " + entry[1].directory.join("package.json"));
                        } else
                        if(mapping[1].type=="jsgi") {
                            if(!UTIL.has(mapping[1], "module")) {
                                throw new Error("module not defined in pinf routing declaration in: " + entry[1].directory.join("package.json"));
                            }
                            // e.g. /pinf/@uid/{uid}/@direct/{path}
                            var route = mapping[0];
                            // prepare helpers to parse out variables and convert route to RegExp
                            var m,
                                re = /\{([^\}]*)\}/g,
                                vars = [];
                            while(m = re.exec(route)) {
                                // NOTE: Each variable can only be specified once for each route!
                                route = route.replace(m[0], "(.*?)");
                                vars.push(m[1]);
                            }
                            routes.push({
                                "raw": mapping[0],
                                "expr": new RegExp("^" + route + "$"),
                                "vars": vars,
                                // NOTE: Dynamic require
                                "app": require(mapping[1].module, entry[0]).app(app)
                            });                            
                        } else {
                            throw new Error("type = '"+mapping[1].type+"' not supported in pinf routing declaration in: " + entry[1].directory.join("package.json"));
                        }
                    });
                }
            } catch(e) {
                system.log.warn(e);
            }
        });
    }

    return function(env) {
        var response,
            m;
        routes.forEach(function(route) {
            if(response) return;
            if(m = env["PATH_INFO"].match(route.expr)) {
                var vars = {};
                for( var i=0 ; i<route.vars.length ; i++ ) {
                    vars[route.vars[i]] = m[i+1];
                }
                env.pinf = {
                    "route": route,
                    "vars": vars
                }
                response = route.app(env);
            }
        });
        if(response) return response;
        return app(env);
    }
}
