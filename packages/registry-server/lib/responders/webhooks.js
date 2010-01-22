
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var EMAIL = require("google/appengine/api/mail");
var QUERYSTRING = require("jack/querystring");
var JSON = require("json");
var TASKQUEUE = require("google/appengine/api/labs/taskqueue");
var VENDOR = require("vendor", "common");

exports.service = function(env) {

    if(env.PATH_INFO.substr(0,23)!="/@webhooks/post-commit/") {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }

    var source = env.PATH_INFO.substr(23);

    try {

        if(source=="github.com") {

            var input = env["jsgi.input"].read().decodeToString();
            var payload = JSON.decode(QUERYSTRING.parseQuery(input).payload.replace(/\\"/g, '"'));
            if(!payload) {
                return {
                    "status": "INVALID_REQUEST",
                    "message": "Invalid request: payload missing"
                };
            }

            new TASKQUEUE.Task({
                "url": "/.tasks/package-check-for-updates",
                "method": "GET",
                "params": {
                    "repository": VENDOR.normalizeRepositoryUrl(payload.repository.url, true),
                    "rev": payload.after,
                    "branch": payload.ref.split("/").pop()
                }
            }).add("github-api");

            return "OK";
            
        } else {
            return {
                "status": "INVALID_REQUEST",
                "message": "Invalid request: Source not supported"
            };
        }
    } catch(e) {
        if(env.environment == "development") {
            throw e;
        }    
        return {
            "status": "INTERNAL_ERROR",
            "message": "Internal error"
        };
    }
}