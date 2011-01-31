

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var URI = require("uri");
var OS = require("os");
var JSON_STORE = require("json-store", "util");
var PACKAGE_DESCRIPTOR = require("./package/descriptor");
var PACKAGE_STORE = require("./package/store");
var PROGRAM_STORE = require("./program/store");
var PACKAGE_SOURCES = require("./package/sources");
var CREDENTIALS_STORE = require("./credentials/store");
var VENDOR = require("./vendor");
var CATALOGS = require("./catalogs");
var WORKSPACES = require("./workspaces");
var PLATFORMS = require("./platforms");
var FS_STORE = require("http/fs-store");
var STRUCT = require("struct");
var MD5 = require("md5");



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
    
    this.catalogs = CATALOGS.Catalogs(this.path.join("catalogs"));

    this.workspaces = WORKSPACES.Workspaces(this.path.join("workspaces"));

    this.platforms = PLATFORMS.Platforms(this.path.join("platforms"));
    
    this.cache = new FS_STORE.Store(this.path.join("cache"));
}

Database.prototype.exists = function() {
    return this.path.exists();
}

Database.prototype.getPath = function() {
    return this.path;
}

Database.prototype.getConfig = function(path) {
    var file = this.path.join("config", path + ".json");
    var config = JSON_STORE.JsonStore(file);
    if(!config.exists()) {
        config.init();
    }
    return config;
}

Database.prototype.getDataPath = function(path) {
    return this.path.join("data", path);
}

Database.prototype.getBackupPath = function(path) {
    return this.path.join("backup", path);
}


/**
 * Get a shortcut path for a shebang path
 * 
 * @see http://www.in-ulm.de/~mascheck/various/shebang/#results
 */
Database.prototype.getShebangPath = function(fullPath) {
    var path = this.path.join("shortcuts", STRUCT.bin2hex(MD5.hash(fullPath.valueOf())));
    if(!path.exists()) {
        path.dirname().mkdirs();
        fullPath.symlink(path);
    }
    return path;
}


Database.prototype.getCache = function() {
    return this.cache;
}

Database.prototype.getCatalogs = function() {
    return this.catalogs;
}

Database.prototype.getWorkspaces = function() {
    return this.workspaces;
}

Database.prototype.getPlatforms = function() {
    return this.platforms;
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
        throw new DatabaseError("Namespace not found in local registry");
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
Database.prototype.hasProgram = function(locator) {
    return this.programStore.has(locator);
}
Database.prototype.buildProgram = function(locator, options) {
    return this.programStore.build(locator, options);
}

Database.prototype.getBuildPathForPackage = function(pkg) {
    var locator = pkg.getLocator();
    if(!locator) {
        throw new DatabaseError("No locator in package: " + pkg.getPath());
    }        
    return this.path.join("builds", locator.getTopLevelId());
}

Database.prototype.getDataPathForPackage = function(pkg) {
    var locator = pkg.getLocator();
    if(!locator) {
        throw new DatabaseError("No locator in package: " + pkg.getPath());
    }        
    return this.path.join("data", locator.getTopLevelId());
}

Database.prototype.getTestPathForPackage = function(pkg) {
    var locator = pkg.getLocator();
    if(!locator) {
        throw new DatabaseError("No locator in package: " + pkg.getPath());
    }        
    return this.path.join("tests", locator.getTopLevelId());
}

Database.prototype.getCredentials = function(uri, environment) {
    return this.credentialsStore.getCredentials(uri, environment);
}

Database.prototype.getWorkspaceForSelector = function(selector) {
    return this.getWorkspaces().getForSelector(selector);
}

Database.prototype.getPlatformForSelector = function(selector) {
    return this.getPlatforms().getForSelector(selector);
}

// TODO: move to "workspaces" module
Database.prototype.mapSources = function() {
    
    // TODO: Allow for reloading dirty catalogs only

    var sources = this.getSources(),
        workspaces = this.getWorkspaces(),
        catalogs = this.getCatalogs(),
        self = this;

    workspaces.forEach(function(workspace) {
    
        workspace.forEachPackage(function(pkg) {
            try {
                if(pkg.hasUid()) {
                    
                    var uid = pkg.getUid(),
                        uri = URI.parse(uid);
    
                    if(uri.domain=="registry.pinf.org" || uri.domain=="private-registry.appspot.com") {
    
                        var id = uri.authorityRoot +
                                 uri.domain + "/" +
                                 uri.directories.slice(0,uri.directories.length-1).join("/"),
                            url = uri.scheme + ":" + 
                                  id + "/" +
                                  "catalog.json",
                            name = uri.directories.pop(),
                            packagePath = self.packageStore.getPackagesPath().join(id, name);
    
                        var catalog = getCatalog(url),
                            revisions = catalog.getRevisionsForPackage(name);
                        if(revisions) {
                            revisions.forEach(function(revision) {
                                if(revision!="*") {
    
                                    if(!workspace.isBranched() || workspace.getBranchName()==revision) {
    
                                        var key = [url, name, revision, "@"];
    
                                        if(sources.spec.has(key)) {
                                            // mapping already found
                                            // ensure existing path exists, if not update with new path
                                            if(!FILE.Path(sources.spec.get(key).path).exists()) {
                                                sources.spec.set(key, {
                                                    "path": pkg.getPath().valueOf()
                                                })
                                            }
                                        } else {
                                            // mapping not found - create it
                                            sources.spec.set(key, {
                                                "path": pkg.getPath().valueOf()
                                            })
                                        }
        
                                        // now that the mappings are updated we need to
                                        // check the packages to ensure there are no hard directories
                                        // where there should be links
        
                                        var path = packagePath.join(revision);
                                        if(path.exists()) {
                                            if(path.isLink()) {
                                                path.remove();
                                            } else {
                                                OS.command("rm -Rf " + path);
                                            }
                                        }
                                        path.dirname().mkdirs();
                                        pkg.getPath().symlink(path);
                                    }
                                }
                            });
                        }
                    }
                }
            } catch(e) {
                system.log.warn(e);
            }
        });
    });

    // now go through all mappings to ensure the paths exist, if not remove the mapping
    checkSources(sources.spec.get());
    
    function checkSources(spec, stack) {
        stack = stack || [];
        UTIL.every(spec, function(item) {
            if(item[0]=="@") {
                if(!FILE.Path(item[1].path).exists()) {
                    var key = UTIL.copy(stack);
                    while(key.length>0) {
                        if(UTIL.len(sources.spec.get(key))==1) {
                            sources.spec.remove(key);
                        }
                        key.pop();
                    }
                }
            } else
            if(typeof item[1] == "object") {
                stack.push(item[0]);
                checkSources(spec[item[0]], stack);
                stack.pop();
            }
        });
    }
    
    var catalogs = {};
    function getCatalog(url) {
        if(!catalogs[url]) {
//            catalogs.update(url);
            catalogs[url] = catalogs.get(url);
        }
        return catalogs[url];
    }
}



var DatabaseError = exports.DatabaseError = function(message) {
    this.name = "DatabaseError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
DatabaseError.prototype = new Error();
