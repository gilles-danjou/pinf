
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");

var pinf;

exports.Router = function(app, options) {

    pinf = options.pinf;

    return function(env) {

        if(pinf && pinf.routes && pinf.routes.length>0) {
            var m;
            for( var i=0,c=pinf.routes.length ; i<c ; i++ ) {
                if(m = env.pathInfo.match(pinf.routes[i].expr)) {
                    return handleRoute(app, env, pinf.routes[i], m);
                }
            }
        }

        return app(env);
    }
}

function handleRoute(app, env, route, match) {
    
    var instructions = route.inst(env);
    
    var handler = pinf.getHandlerForId(route["package"] + ":" + route.module + ":" + instructions.handler);

    var args = {};
    if(instructions.arguments) {
        UTIL.forEach(instructions.arguments, function(arg) {
            if(arg[1].substring(0,1)=="$") {
                args[arg[0]] = match[arg[1].substring(1)*10/10];
            } else {
                args[arg[0]] = arg[1];
            }
        });
    }
    env.pinf.route = {
        "args": args
    };
    
    var response;

    try {

        response = handler(env);

    } catch(e) {
        system.log.error(e);
        return {
            "status": "500",
            "headers": {
                "content-type": "text/html"
            },
            "body": [
                "Internal Server Error"
            ]
        }
    }

    if(response===true) {
        // adjust route if applicable
        if(instructions.route) {
            env.pathInfo = instructions.route;
        }
        return app(env);
    } else
    if(response===false) {
        // TODO: Stop execution, we had an internal error
    }
    return response;
}
