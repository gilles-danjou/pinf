
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var EMAIL = require("google/appengine/api/mail");
var QUERYSTRING = require("jack/querystring");
var JSON = require("json");
var TASKQUEUE = require("google/appengine/api/labs/taskqueue");
var VENDOR = require("vendor", "common");
var FILE = require("file");
var UTIL = require("util");

exports.service = function(env) {

    if(env.PATH_INFO.substr(0,23)!="/@webhooks/post-commit/") {
        return {
            "status": "INVALID_REQUEST",
            "message": "Invalid request"
        };
    }

    var source = env.PATH_INFO.substr(23);

    try {

        var input = env["jsgi.input"].read().decodeToString();

        new TASKQUEUE.Task({
            "url": "/.tasks/package-check-for-updates",
            "method": "GET",
            "params": VENDOR.normalizeCommitInfo(source, QUERYSTRING.parseQuery(input))
        }).add("github-api");

        return "OK";

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