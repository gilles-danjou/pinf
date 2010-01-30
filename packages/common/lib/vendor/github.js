
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var URI = require("uri");
var PINF = require("../pinf");
var HTTP_CLIENT = require("http-client");
var UTIL = require("util");

var Vendor = exports.Vendor = function() {
    if (!(this instanceof exports.Vendor))
        return new exports.Vendor();
}

Vendor.prototype.getName = function() {
    return "github.com";
}

Vendor.prototype.parseUrl = function(uri) {
    if(!(uri instanceof URI.URI)) {
        uri = URI.parse(uri);
    }
    if(uri.domain!="github.com") {
        throw new Error("Invalid URL");
    }
    var info = { "vendor": this },
        m;
    if(m = uri.path.match(/^\/([^\/]*)\/([^\/]*)\/?((zipball)\/(.*?))?\/?$/)) {
        info["user"] = m[1];
        info["repository"] = m[2];
        if(m[4] && m[4]=="zipball") {
            info["action"] = {
                "name": "download",
                "type": "zip"
            }
            if(!m[5]) {
                throw new Error("Missing branch/rev from download URL: " + uri.url);
            }
            info["rev"] = m[5];
        }
    }
    return info;    
}

Vendor.prototype.hasRepository = function(info) {
    if(!info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    var result = callAPI("repos/show/" + info.user);
    if(!result.repositories || result.repositories.length==0) {
        return false;
    }
    var names = UTIL.map(result.repositories, function(repository) {
        return repository.name;
    });
    return UTIL.has(names, info.repository);
}

Vendor.prototype.getRepositoryInfo = function(info) {
    if(!info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    var result = callAPI("repos/show/" + info.user + "/" + info.repository);
    if(!result.repository) {
        return false;
    }
    return {
        "name": result.repository.name,
        "forked": result.repository.fork
    }
}

Vendor.prototype.createRepository = function(info) {

    var result = callAPI("repos/create", {
        "name": info.repository
    });
    if(!result || !result.repository) return false;
    if(result.repository.name!=info.repository) {
        throw new Error("Created repositry with name '"+result.repository.name+"' instead of requested '"+info.repository+"'.");
    }
    return true;
}

Vendor.prototype.getWorkspacePath = function(info) {
    if(!info.vendor || !info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    return info["vendor"].getName() + "/" + info["user"] + "/" + info["repository"];
}

Vendor.prototype.getRepositoryUrl = function(info) {
    var credentials = PINF.getCredentials("http://github.com/api/");
    if(!credentials || credentials.login!=info.user) {
        return this.getPublicRepositoryUrl(info);
    } else {
        return this.getPrivateRepositoryUrl(info);
    }
}

Vendor.prototype.getPublicRepositoryUrl = function(info) {
    if(!info.vendor || !info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    return "git://"+info["vendor"].getName()+"/"+info["user"]+"/"+info["repository"]+".git";
}

Vendor.prototype.getPrivateRepositoryUrl = function(info) {
    if(!info.vendor || !info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    return "git@"+info["vendor"].getName()+":"+info["user"]+"/"+info["repository"]+".git";
}

Vendor.prototype.getDownloadInfoForUrl = function(url) {
    var info = this.parseUrl(url);
    if(!info || !info.action || info.action.name!="download") {
        throw new Error("Invalid download URL: " + url);
    }
    return {
        "type": info.action.type,
        "url": url
    }
}

function callAPI(command, args) {

    var url = "http://github.com/api/v2/json/" + command;

    var credentials = PINF.getCredentials(url);

    if(!credentials.login || !credentials.token) {
        throw new Error("Invalid github credentials");
    }

    args = args || {};
    args["login"] = credentials.login;
    args["token"] = credentials.token;

    var data = [];
    UTIL.every(args, function(arg) {
        data.push(arg[0] + "=" + escape(arg[1]));
    });
    data = data.join("&");

    var response = HTTP_CLIENT.HttpClient({
        "method": "POST",
        "url": url,
        "headers": {
            "Content-Length": data.length,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "body": [
            data
        ]
    }).connect();

    var body = [];
    response.body.forEach(function(chunk) {
        body.push(chunk.decodeToString());
    });
    
    return JSON.decode(body.join(""));
}
