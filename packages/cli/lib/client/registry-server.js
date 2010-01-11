

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };



var UTIL = require("util");
var HTTP_CLIENT = require("http-client");
var JSON = require("json");
var PINF = require("../pinf");
var VALIDATOR = require("validator", "util");
var PACKAGE_DESCRIPTOR = require("../package-descriptor");
var GIT = require("../revision-control/git");


var Client = exports.Client = function(uri) {
    if (!(this instanceof exports.Client))
        return new exports.Client(uri);
    
    this.uri = uri;
}

Client.prototype.formatUri = function(segments) {
    var self = this,
        uri = [];
    UTIL.forEach(segments, function(segment) {
        if(segment=="scheme") {
            uri.push(self.uri.scheme);
        } else
        if(segment=="authority") {
            uri.push(self.uri.authority);
        } else
        if(segment=="domain") {
            uri.push(self.uri.domain);
        } else
        if(segment=="path") {
            uri.push(self.uri.path);
        } else {
            uri.push(segment);
        }
    });
    return uri.join("");   
}

Client.prototype.getUriInfo = function(options, useAccount) {

    var database = PINF.getDatabase(),
        registriesConfig = database.getConfig("registries"),
        namespacesConfig = database.getConfig("namespaces");

    // http://127.0.0.1:8080/christoph@christophdorn.com/public/
    //        <server>       <owner>                     <path>
    //                       [namespace                       ]
    var info = {
        "url": this.uri.url,
        "server": this.uri.domain,
        "owner": this.uri.directories[0]
    };
    info["ownerType"] = (VALIDATOR.validate("email", info["owner"], {"throw": false}))?"email":"hostname";
    info["path"] = this.uri.directories.slice(1).join("/");
    info["namespace"] = info["owner"] + "/" + info["path"];
    info["user"] = options["user"] || null;
    info["authkey"] = options["authkey"] || null;
    
    if(info["ownerType"]=="email") {
        if(options["user"]) {
            throw new ClientError("User specified for email owner");
        }
        if(!info["user"]) {
            info["user"] = info["owner"];
        }
    } else
    if(info["ownerType"]=="hostname") {
        throw new ClientError("TODO: LOOKUP REGISTRY IN NAMESPACE");
    }
    
    if(!info["registry"]) {
        info["registry"] = [info["server"], ":", info["user"]].join("");
    }
    
    var registryInfo = registriesConfig.get([info["registry"]]);
    if(registryInfo) {
        if(!info["user"] || useAccount) {
            info["user"] = registryInfo.user;
        }
        if(!info["authkey"] || useAccount) {
            info["authkey"] = registryInfo.authkey;
        }
    } else
    if(useAccount) {
        throw new ClientError("Account for namespace not found");
    }

    if(info["ownerType"]=="hostname") {
        if(!info["user"]) {
            throw new ClientError("User required");
        }        
    }

    return info;
}

Client.prototype.registerNamespace = function(options) {

    var database = PINF.getDatabase(),
        registriesConfig = database.getConfig("registries"),
        namespacesConfig = database.getConfig("namespaces");
    
    var info = this.getUriInfo(options);

    if(!options.ignore && namespacesConfig.has([info.namespace])) {
        throw new ClientError("Namespace already configured in '" + namespacesConfig.getFile() + "'");
    }

    var args = {
        "user": info.user,
        "authkey": info.authkey || "__REQUEST__"
    };

    var response = makeRequest(info.url, "register-namespace", args);

    if(response.status=="NAMESPACE_REGISTERED") {

        registriesConfig.set([[info.server, ":", info.user]], {
            "server": this.formatUri(["scheme", "://", "authority", "/"]),
            "user": info.user,
            "authkey": response.authkey
        });
        
        namespacesConfig.set([info.namespace], {
            "registry": [info.server, ":", info.user].join("")
        });
    }

    options.print(response.message);
}

Client.prototype.registerPackage = function(options) {
    
    var info = this.getUriInfo(options, true);

    var descriptor = PACKAGE_DESCRIPTOR.PackageDescriptor(options.directory.join("package.json"));

    if(descriptor.hasUid()) {
        throw new ClientError("Cannot register package. A 'uid' property already exists in package descriptor found at: " + options.directory.join("package.json").valueOf());
    }

    var args = {
        "user": info.user,
        "authkey": info.authkey,
        "package": descriptor.getName()
    };

    var response = makeRequest(info.url, "register-package", args);

    if(response.status=="PACKAGE_REGISTERED") {

        descriptor.setUid(response.uid);

    }

    options.print(response.message);
}

Client.prototype.announceRelease = function(options) {
    
    var git = GIT.Git(options.directory);
    if(!git.initialized()) {
        throw new ClientError("No git repository found at: " + options.directory.valueOf());
    }

    var descriptor = PACKAGE_DESCRIPTOR.PackageDescriptor(options.directory.join("package.json"));

    if(!descriptor.hasUid()) {
        throw new ClientError("Cannot announce release. The 'uid' property is missing in the package descriptor found at: " + options.directory.join("package.json").valueOf());
    }

    var info = this.getUriInfo(options, true);

    if(info.url!=descriptor.getRegistryUri()) {
        throw new ClientError("Cannot announce release. The 'uid' registry URL does not match the registry URL derived from the local PINF setup!");
    }

    var args = {
        "user": info.user,
        "authkey": info.authkey,
        "package": descriptor.getName()
    };
    
    if(options.branch) {
        // announce a new branch revision
        args["branch"] = options.branch;
        args["revision"] = git.getLatestRevisionForBranch(options.branch);
        args["descriptor"] = JSON.decode(git.getFileForRef(args["revision"], "package.json"));
    } else {
        // announce a new version tag
        args["version"] = git.getLatestVersion(options.major);
        args["descriptor"] = JSON.decode(git.getFileForRef("v"+args["version"], "package.json"));
    }
    
    var response = makeRequest(info.url, "announce-release", args);

    if(response.status=="RELEASE_ANNOUNCED") {
    }

    options.print(response.message);
}



var ClientError = exports.ClientError = function(message) {
    this.name = "ClientError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
ClientError.prototype = new Error();



function makeRequest(url, action, args) {

/*
    var body = "";

    url += "?action=" + action;
    UTIL.every(args, function(arg) {
        url += "&" + arg[0] + "=" + arg[1];
    });
*/    
    args["action"] = action;
    
    var body = JSON.encode(args);
    var response = HTTP_CLIENT.HttpClient({
        "method": "POST",
        "url": url,
        "headers": {
            "Content-Length": body.length,
            "Content-Type": "application/json"
        },
        "body": [
            JSON.encode(args)
        ]
    }).connect();
    
    var body = [];
    response.body.forEach(function(chunk) {
        body.push(chunk.decodeToString());
    });
    
    return JSON.decode(body.join(""));
}
