

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var URI = require("uri");
var FILE = require("file");
var WORKSPACE = require("./workspace");
var VENDOR = require("./vendor");



var Workspaces = exports.Workspaces = function(path) {
    if (!(this instanceof exports.Workspaces))
        return new exports.Workspaces(path);

    this.path = path;
}

Workspaces.prototype.getPath = function() {
    return this.path;
}

/**
 * Supported selectors:
 *   * http://github.com/cadorn/pinf/ (+ URI.URI variant)
 *   * http://github.com/cadorn/pinf (+ URI.URI variant)
 *   * github.com/cadorn/pinf/ (+ URI.URI variant)
 *   * github.com/cadorn/pinf (+ URI.URI variant)
 *   * .../pinf/workspaces/github.com/cadorn/pinf (+ File.Path variant)
 *   * .../pinf/workspaces/github.com/cadorn/pinf/... (+ File.Path variant)
 *       will go up the tree until it finds the last package.json file
 */
Workspaces.prototype.getForSelector = function(selector, useExactPath) {
    if(selector instanceof URI.URI) {
        selector = selector.url;
    } else
    if(selector instanceof FILE.Path) {
        selector = selector.canonical();
    }
    var path;
    if(useExactPath) {
        path = FILE.Path(""+selector);
        if(!FILE.isAbsolute(path)) {
            throw new Error("Selector is not an absolute path!");
        }
        if(path.valueOf().substr(0, this.path.join("").valueOf().length)!=this.path.join("").valueOf()) {
            throw new Error("Workspace selector path '"+path+"' does not fall within workspaces directory: " + this.path.join(""));
        }
        selector = "http://" + this.path.join("").relative(path);
    } else
    if(selector instanceof FILE.Path || FILE.Path(selector).exists()) {
        path = FILE.Path(""+selector);
        if(path.valueOf().substr(0, this.path.join("").valueOf().length)!=this.path.join("").valueOf()) {
            throw new Error("Workspace selector path '"+path+"' does not fall within workspaces directory: " + this.path.join(""));
        }
        var lastMatch;
        while(path.split().length>this.path.split().length) {
            if(path.join("package.json").exists()) {
                lastMatch = path;
            }
            path = path.dirname();
        }
        if(!lastMatch) {
            throw new Error("No workspace found for selector: " + selector);
        }
        selector = "http://" + this.path.join("").relative(lastMatch);
    } else
    if(!/^http:\/\//.test(selector)) {
        selector = "http://" + selector;
    }
    var workspace;
    try {
        var vendor = VENDOR.getVendorForUrl(selector);
        var info = vendor.parseUrl(selector);
        if(!info.user || !info.repository) {
            throw new Error("Not a valid repository URL");
        }
        workspace = WORKSPACE.Workspace(this.path.join(vendor.getWorkspacePath(info)));
        workspace.setVendorInfo(info);
    } catch(e) {
        workspace = WORKSPACE.Workspace(path);
    }
    return workspace;
}

Workspaces.prototype.forEach = function(callback, subPath) {
    var path = this.path,
        self = this;
    if(subPath) {
        path = path.join(subPath);
    }
    var found = false,
        dirs = [];
    path.listPaths().forEach(function(item) {
        if(found) return;
        if(item.basename()=="package.json") {
            found = true;
            callback(self.getForSelector(item.dirname(), true));
        } else
        if(item.isDirectory()) {
            dirs.push(item.basename());
        }
    });
    if(!found) {
        dirs.forEach(function(dir) {
            self.forEach(callback, (subPath)?subPath.join(dir):dir);
        });
    }
}
