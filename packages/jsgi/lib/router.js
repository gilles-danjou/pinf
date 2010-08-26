
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


exports.Router = function(app) {
    
    return function(env) {

        if(env.pinf) {

            // check if we have a matching route
            for( var route in env.pinf.routes ) {
                // first check exact match
                if(route==env["pathInfo"]) {
                    return env.pinf.routes[route](env);
                }
            }
        }

        return app(env);
    }
}

