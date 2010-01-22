

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var DEBUG = false;

var UTIL = require("util");
var JSON = require("json");
var QUERYSTRING = require("jack/querystring");
var USER = require("./user");
var CACHE = require("./cache");


CACHE.setSeed("2");

exports.app = function(env) {

    if(env.environment == "development") {
        DEBUG = true;
        CACHE.setEnabled(false);
    }

    var status,
        body,
        contentType,
        response;

    if(env.PATH_INFO.substr(0,8)=="/.tasks/") {

        if(DEBUG) {
            print("--------- REQUEST ---------");
            UTIL.every(env, function(item2) {
                print("    " + item2[0] + ": " + item2[1]);
            });
            print("--------- REQUEST ---------");
        }

        status = 200;
        contentType = "text/plain";
        response = require("./tasks/" + env.PATH_INFO.substr(8)).service(env);
        if(response == "OK") {
            body = response;
        } else {
            if(/^\d*$/.test(response.status)) {
                status = response.status;
                body = response.message;
            } else {
                status = 501;
                body = JSON.encode(response, null, "  ");            
            }
       }

    } else
    if(env.REQUEST_METHOD=="POST" && env.PATH_INFO.substr(0,2)!="/@") {

        var path = env.PATH_INFO.substr(1, env.PATH_INFO.length-1).split("/");

        if(!path[path.length-1]) path.pop();

//            var qs = QUERYSTRING.parseQuery(env.QUERY_STRING);
        var qs = JSON.decode(env["jsgi.input"].read().decodeToString());
    
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
        
        var url = [
            "http://"
        ];
        url.push(env.SERVER_NAME);
        if(env.SERVER_PORT && env.SERVER_PORT!="80") {
            url.push(":" + env.SERVER_PORT);
        }
        url.push("/");
        request.baseUrl = url.join("");
        
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
            
            // user is authorized - handle action
            response = require("./actions/" + qs["action"]).handle(request);
        }
    
        status = 200;
        contentType = "application/json";
        body = JSON.encode(response, null, "  ");
    
    } else {

        if(DEBUG) {
            print("--------- REQUEST ---------");
            UTIL.every(env, function(item2) {
                print("    " + item2[0] + ": " + item2[1]);
            });
            print("--------- REQUEST ---------");
        }

        status = 200;
        contentType = "text/plain";
        
        if(env.SERVER_NAME.substr(0,4)=="www.") {
            response = require("./responders/www").service(env);
        } else
        if(env.PATH_INFO.substr(0,8)=="/@feeds/") {
            response = require("./responders/feeds").service(env);
        } else
        if(env.PATH_INFO.substr(0,11)=="/@webhooks/") {
            response = require("./responders/webhooks").service(env);
        } else {
            response = require("./responders/public").service(env);
        }
        if(typeof response == "string") {
            body = response;
            if(/^<html>/g.test(body)) {
                contentType = "text/html";
            }
        } else {
            if(/^\d*$/.test(response.status)) {
                status = response.status;
                body = response.message;
            } else {
                body = JSON.encode(response, null, "  ");            
            }
       }
    }

    if(DEBUG) {
        print("--------- RESPONSE ---------");
        print(body);
        print("--------- RESPONSE ---------");
    }

    return {
        status: status,
        headers: {
            "Content-Type": contentType,
            "Content-Length": String(body.length)
        },
        body: [
            body
        ]
    };
};
