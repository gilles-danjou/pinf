
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
    return "default";
}

Vendor.prototype.parseUrl = function(uri) {
    if(!(uri instanceof URI.URI)) {
        uri = URI.parse(uri);
    }
    if(!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(uri.domain)) {
        throw new Error("Invalid URL");
    }
    var info = { "vendor": this },
        m;
    if(m = uri.path.match(/^([\w\d]*)\.git$/)) {
        info["domain"] = uri.domain;
        info["user"] = false;
        info["repository"] = m[1];
    }
    return info;
}

Vendor.prototype.hasRepository = function(info) {
print("Vendor.prototype.hasRepository");    
/*    
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
*/
}

Vendor.prototype.getRepositoryInfo = function(info) {
print("Vendor.prototype.getRepositoryInfo");    
/*
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
*/
}

Vendor.prototype.createRepository = function(info) {
print("Vendor.prototype.createRepository");    
/*
    var result = callAPI("repos/create", {
        "name": info.repository
    });
    if(!result || !result.repository) return false;
    if(result.repository.name!=info.repository) {
        throw new Error("Created repositry with name '"+result.repository.name+"' instead of requested '"+info.repository+"'.");
    }
    return true;
*/    
}

Vendor.prototype.getWorkspacePath = function(info) {
    if(!info.vendor || !info.domain || !info.repository) {
        throw new Error("Invalid argument");
    }
    return info["domain"] + "/" + info["repository"];
}

Vendor.prototype.getRepositoryUrl = function(info) {
print("Vendor.prototype.getRepositoryUrl");    
/*    
    var credentials = PINF.getCredentials("http://github.com/api/");
    if(!credentials || credentials.login!=info.user) {
        return this.getPublicRepositoryUrl(info);
    } else {
        return this.getPrivateRepositoryUrl(info);
    }
*/    
}

Vendor.prototype.getPublicRepositoryUrl = function(info) {
print("Vendor.prototype.getPublicRepositoryUrl");    
/*
    if(!info.vendor || !info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    return "git://"+info["vendor"].getName()+"/"+info["user"]+"/"+info["repository"]+".git";
*/
}

Vendor.prototype.getPrivateRepositoryUrl = function(info) {
print("Vendor.prototype.getPrivateRepositoryUrl");    
/*
    if(!info.vendor || !info.user || !info.repository) {
        throw new Error("Invalid argument");
    }
    return "git@"+info["vendor"].getName()+":"+info["user"]+"/"+info["repository"]+".git";
*/
}

Vendor.prototype.getDownloadInfoForUrl = function(url) {
print("Vendor.prototype.getDownloadInfoForUrl");    
/*
    var info = this.parseUrl(url);
    if(!info || !info.action || info.action.name!="download") {
        throw new Error("Invalid download URL: " + url);
    }
    return {
        "type": info.action.type,
        "url": url
    }
*/
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
