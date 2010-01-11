

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

const DEBUG = true;

var UTIL = require("util");
var JSON = require("json");
var QUERYSTRING = require("jack/querystring");
var USER = require("./user");

exports.app = function(env) {
    
    var body,
        contentType;
    
    if(env.QUERY_STRING) {
    
        var path = env.PATH_INFO.substr(1, env.PATH_INFO.length-1).split("/"),
            response;

        if(!path[path.length-1]) path.pop();
        
        if(path.length==1) {
            response = {
                "status": "INVALID_REQUEST",
                "message": "Invalid request"
            };        
        } else {

            var qs = QUERYSTRING.parseQuery(env.QUERY_STRING);
        
            var request = {
                "env": env,
                "action": qs["action"] || null,
                "user": qs["user"] || null,
                "authkey": qs["authkey"] || null,
                "namespace": path.join("/"),
                "owner": path.shift(),
                "path": path,
                "args": qs
            }
            
            if(DEBUG) {
                print("--------- REQUEST ---------");
                UTIL.every(request, function(item1) {
                    if(item1[0]=="env" || item1[0]=="args") {
                        print("  " + item1[0] + ":");
                        UTIL.every(item1[1], function(item2) {
                            print("    " + item2[0] + ": " + item2[1]);
                        });
                    } else {
                        print("  " + item1[0] + ": " + item1[1]);
                    }
                });
                
                print("--------- REQUEST ---------");
            }

            if(!request.action || !request.user || !request.authkey) {
                response = {
                    "status": "INVALID_REQUEST",
                    "message": "Invalid request"
                };        
            }

            response = USER.authorize(request);
    
            if(response.status=="AUTHORIZED") {
                response = require("./actions/" + qs["action"]).handle(request);
            }
        }
    
        contentType = "application/json";
        body = JSON.encode(response, null, '  ');
    
    } else {

        contentType = "text/plain";
        var response = require("./responders/public").service(env);
        body = JSON.encode(response, null, '  ');
        
    }

    if(DEBUG) {
        print("--------- RESPONSE ---------");
        print(body);
        print("--------- RESPONSE ---------");
    }

    return {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Length": String(body.length)
        },
        body: [
            body
        ]
    };
};
