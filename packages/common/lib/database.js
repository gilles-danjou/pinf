

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var JSON_STORE = require("json-store", "util");
var PACKAGE_DESCRIPTOR = require("./package/descriptor");
var PACKAGE_STORE = require("./package/store");
var PROGRAM_STORE = require("./program/store");
var PACKAGE_SOURCES = require("./package/sources");
var CREDENTIALS_STORE = require("./credentials/store");
var WORKSPACE = require("./workspace");
var PLATFORM = require("./platform");
var VENDOR = require("./vendor");


var Database = exports.Database = function(path) {
    if (!(this instanceof exports.Database))
        return new exports.Database(path);

    this.path = path;

    if(!this.exists()) {
        this.path.mkdirs();
    }

    this.packageStore = PACKAGE_STORE.PackageStore(this.path);
    this.packageStore.setSources(this.getSources());

    this.programStore = PROGRAM_STORE.ProgramStore(this.path);
    this.programStore.setPackageStore(this.packageStore);

    this.credentialsStore = CREDENTIALS_STORE.CredentialsStore(this.path.join("config", "credentials.json"));
}

Database.prototype.exists = function() {
    return this.path.exists();
}

Database.prototype.getConfig = function(path) {
    var file = this.path.join("config", path + ".json");
    var config = JSON_STORE.JsonStore(file);
    if(!config.exists()) {
        config.init();
    }
    return config;
}

Database.prototype.getSources = function() {
    var path = this.path.join("config", "sources.json");
    if(!path.exists()) {
        path.dirname().mkdirs();
        path.write("{}");
    }
    return PACKAGE_SOURCES.PackageSources(path);
}

Database.prototype.getRegistryUriForNamespace = function(namespace) {
    var registry = this.getConfig("namespaces").get([namespace, "registry"]);
    if(!registry) {
        throw new Error("Namespace not found in local registry");
    }
    var registryInfo = this.getConfig("registries").get([registry]);
    return URI.parse(registryInfo.server + namespace + "/");
}

Database.prototype.getRegistryUriForPackage = function(path) {
    var descriptor = PACKAGE_DESCRIPTOR.PackageDescriptor(path.join("package.json"));
    return URI.parse(descriptor.getRegistryUri());
}

Database.prototype.getPackageStore = function() {
    return this.packageStore;
}

Database.prototype.getPackage = function(locator) {
    return this.packageStore.get(locator);
}

Database.prototype.getProgram = function(locator) {
    return this.programStore.get(locator);
}

Database.prototype.getBuildPathForPackage = function(pkg) {
    var workspace = this.getWorkspaceForSelector(pkg.getPath()),
        locator = pkg.getLocator(),
        branch = workspace.getRevisionControlBranch();
    if(!locator) {
        throw new Error("No locator in package");
    }        
    return this.path.join("builds", locator.getFsPath(), branch);
}

Database.prototype.getCredentials = function(uri, environment) {
    return this.credentialsStore.getCredentials(uri, environment);
}

/**
 * Supported selectors:
 *   * http://github.com/cadorn/pinf/ (+ URI.URI variant)
 *   * http://github.com/cadorn/pinf (+ URI.URI variant)
 *   * github.com/cadorn/pinf/ (+ URI.URI variant)
 *   * github.com/cadorn/pinf (+ URI.URI variant)
 *   * .../pinf/workspaces/github.com/cadorn/pinf (+ File.Path variant)
 *   * .../pinf/workspaces/github.com/cadorn/pinf/... (+ File.Path variant)
 *       will go up the tree until it finds .pinf-workspace.json
 */
Database.prototype.getWorkspaceForSelector = function(selector) {
    if(selector instanceof URI.URI) {
        selector = selector.url;
    } else
    if(selector instanceof FILE.Path) {
        selector = selector.canonical();
    }
    if(selector instanceof FILE.Path || FILE.Path(selector).exists()) {
        var basePath = this.path.join("workspaces"),
            path = FILE.Path(""+selector);
        if(path.valueOf().substr(0, basePath.join("").valueOf().length)!=basePath.join("").valueOf()) {
            throw new Error("Workspace selector path '"+path+"' does not fall within workspaces directory: " + basePath.join(""));
        }
        while(path.split().length>basePath.split().length) {
            if(path.join(".pinf-workspace.json").exists()) {
                break;
            }
            path = path.dirname();
        }
        if(!path.join(".pinf-workspace.json").exists()) {
            throw new Error("No workspace found for selector: " + selector);
        }
        selector = "http://" + basePath.join("").relative(path);
    } else
    if(!/^http:\/\//.test(selector)) {
        selector = "http://" + selector;
    }
    var vendor = VENDOR.getVendorForUrl(selector);
    var info = vendor.parseUrl(selector);
    if(!info.user || !info.repository) {
        throw new Error("Not a valid repository URL");
    }
    var workspace = WORKSPACE.Workspace(this.path.join("workspaces", vendor.getWorkspacePath(info)));
    workspace.setVendorInfo(info);
    return workspace;
}

Database.prototype.getPlatformForName = function(name) {
    return PLATFORM.Platform(this.path.join("platforms", name));
}
