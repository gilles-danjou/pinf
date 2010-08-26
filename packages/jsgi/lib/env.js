
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");

var pinfHelper;

exports.Env = function(app, options) {
    
    pinfHelper.options = options || {};
    
    pinfHelper.registerRoutes({
        
        
    });

    return function(env) {

        if(env.pinf) {
            throw new Error("'pinf' property already found in jsgi env");
        }

        env.pinf = exports.getHelper();
        
        return app(env);
    }
}

exports.getHelper = function() {
    return pinfHelper;
}

pinfHelper = {

    "options": {},
    "helpers": {},
    "routes": {},

    "getBaseUrl": function() {
        if(!this.options.baseUrl) {
            throw new Error("baseUrl not set!");
        }
        // TODO: baseUrl may not end in a slash
        return this.options.baseUrl;
    },

    "registerHelper": function(module, name, helper) {
        var id = packageForModule(module) + ":" + moduleForModule(module);
        if(!this.helpers[id]) {
            this.helpers[id] = {};
        }
        this.helpers[id][name] = helper;
    },

    "getHelper": function(id, name) {
        if(!this.helpers[id]) {
            throw new Error("helper for id '" + id + "' not found!");
        }
        if(!this.helpers[id][name]) {
            throw new Error("helper with name '" + name + "' for id '" + id + "' not found!");
        }
        return this.helpers[id][name];
    },

    "registerHandler": function(module, path, handler) {
        // TODO: path may not start with a slash
        var urlPath = '/pinf/@package/' + packageForModule(module) + '/@module/' + moduleForModule(module) + '/@handler/' + path;
        this.routes[urlPath] = handler;
        return urlPath;
    },

    "registerRoutes": function(routes) {
        UTIL.forEach(routes, function(route, options) {

        this.routes[urlPath] = handler;
            
        });
    },

    "getRawPostData": function(env) {
        var rawData = [];
        env.input.forEach(function(chunk) {
            rawData.push(chunk);
        });
        return rawData.join("");
    },

    "getPostData": function(env) {
        this.getRawPostData().split("&").forEach(function(pair) {
            pair = pair.split("=");
            data[URI.unescapeComponent(pair[0])] = URI.unescapeComponent(pair[1]);
        });
        return data;
    }
};


function packageForModule(module) {
    return URI.parse(module.uid).directories.join("/");
}

function moduleForModule(module) {
    var parts = module.id.split(module["package"]);
    // TODO: Remove /lib/ in more reliable way by looking at package descriptor
    return parts[1].substring(5);
}
