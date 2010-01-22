
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var QUERYSTRING = require("jack/querystring");
var PACKAGE = require("../package");
var MODELS = require("../models");
var SEMVER = require("semver", "util");
var VENDOR = require("vendor", "common");
var UTIL = require("util");
var HTTP = require("http");

exports.service = function(env) {

    var qs = QUERYSTRING.parseQuery(env.QUERY_STRING);

    var paths = JSON.decode(qs.paths);

    // lookup all packages with the same repository
    var result = MODELS.getModel("Package").all().filter("repositories IN", [qs.repository]).fetch();
    if(!result || result.length==0) return "OK";
    
    var packages = [];
    // remove all packages not affected by paths
    result.forEach(function(data) {
        var pkg = PACKAGE.Package(data.datastoreKey().getName(), data);
        var info = pkg.getRepositoryInfo();
        var include = false;
        
        if(!info.path) {
            include = true;
        } else {
            paths.forEach(function(path) {
                if(include) return;
                if(path.substr(0, info.path.length)==info.path) {
                    include = true;
                }
            });
        }
        if(include) {
            packages.push(pkg);
        }
    });

    if(packages.length==0) return "OK";


    // fetch tags for repository
    var tags = VENDOR.getTagsForRepository(qs.repository);
    if(!tags) return "OK";
    tags = SEMVER.versionsForTags(UTIL.keys(tags));
    if(!tags) return "OK";
    // latest version
    var version = tags.pop();


    packages.forEach(function(pkg) {

        var ver = pkg.getLatestVersion(version);
        if(ver && ver!=version) {

            var url = VENDOR.rawUrlForRepository(pkg.getRepositoryInfo()).
                        replace(/{rev}/, "v"+version).replace(/{path}/, "package.json");

            var descriptor = UTIL.trim(HTTP.read(url).decodeToString());
            if(descriptor && descriptor.substr(0,1)=="{") {
                try {
                    pkg.announceVersion(version, JSON.decode(descriptor));
                } catch(e) {
                    // this will fail if the descriptor is invalid
                    // TODO: Send email to owner about invalid package descriptor?
                }
            }
        }

        var rev = pkg.getLastRevision(qs.branch);
        if(rev && rev!=qs.rev) {

            var url = VENDOR.rawUrlForRepository(pkg.getRepositoryInfo()).
                        replace(/{rev}/, qs.rev).replace(/{path}/, "package.json");

            var descriptor = UTIL.trim(HTTP.read(url).decodeToString());
            if(descriptor && descriptor.substr(0,1)=="{") {
                try {
                    pkg.announceRevision(qs.branch, qs.rev, JSON.decode(descriptor));
                } catch(e) {
                    // this will fail if the descriptor is invalid
                    // TODO: Send email to owner about invalid package descriptor?
                }
            }
        }
    });
                
    return "OK";
}
