
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var EMAIL = require("google/appengine/api/mail");


exports.service = function(env) {
    
    if(env.PATH_INFO=="/@webhooks/post-commit") {
    
        var data = {
            "json": env["jsgi.input"].read().decodeToString()
        };
    
        var email = new EMAIL.EmailMessage({
            "sender": '"PINF Registry Server" <registry-server@pinf.org>',
            "to": '"christoph@christophdorn.com" <christoph@christophdorn.com>',
            "subject": "Post Commit Data",
            body: JSON.encode(data, null, "    ")
        }).send();
    }
}