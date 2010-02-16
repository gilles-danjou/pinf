

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var OS = require("os");
var UTIL = require("util");
var PINF = require("./pinf");
var GIT = require("git", "util");
var FILE = require("file");
var JSON_STORE = require("json-store", "util");
var TERM = require("term");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");


var Workspace = exports.Workspace = function(path) {
    if (!(this instanceof exports.Workspace))
        return new exports.Workspace(path);
    this.path = path;
}

Workspace.prototype = PACKAGE.Package();


Workspace.prototype.getConfig = function() {
    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }

    if(!this.config) {
        this.config = JSON_STORE.JsonStore(this.getPath().join(".pinf-workspace.json"));
        if(!this.config.exists()) {
            this.config.init();
        }
    }
    return this.config;
}

Workspace.prototype.setVendorInfo = function(info) {
    this.vendorInfo = info;
}

Workspace.prototype.hasVendorInfo = function() {
    return (!!this.vendorInfo);
}

Workspace.prototype.getVendorInfo = function() {
    if(!this.hasVendorInfo()) {
        throw new Error("No vendor info set!");
    }
    return this.vendorInfo;
}

Workspace.prototype.hasPlatform = function() {
    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }

    return this.getConfig().has(["platform"]);
}

Workspace.prototype.getPlatform = function() {
    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }

    var config = this.getConfig(),
        key = ["platform"];
    if(!config.has(key)) {
        throw new Error("No platform activated for workspace");
    }
    return PINF.getPlatformForName(config.get(key));
}

Workspace.prototype.setPlatform = function(platform) {
    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }

    var config = this.getConfig(),
        key = ["platform"],
        oldPlatform = config.get(key);

    config.set(key, platform.getName());

    // write workspace activation file
    var sourcePath = FILE.Path(module.path).dirname().join("../bin/activate-workspace");
    var targetPath = this.getPath().join("bin", ".pinf-activate-workspace");
    targetPath.dirname().mkdirs();

    var contents = sourcePath.read();
    // named and colored prompt
    var customizations = [
        // OSX Terminal
        'export PS1="\\e[00;35mTUSK[\\e[00;33m' + this.getName() + '\\e[00;35m]:\\e[m "',
        // OSX iTerm (http://xanana.ucsc.edu/xtal/iterm_tab_customization.html)
        'echo -ne "\\e]1;TUSK[' + this.getName() + ']\\a"',
        'echo -ne "\\e]2;TUSK[' + this.getName() + '] @ ' + this.getPath().valueOf() + '\\a"'
    ];
    contents = contents.replace(/\n\s*__SHELL_CUSTOMIZATIONS__\s*\n/, "\n" + customizations.join("\n") + "\n");
    contents = contents.replace(/__PINF_PLATFORM_HOME__/g, platform.getPath().valueOf());
    contents = contents.replace(/__PINF_WORKSPACE_HOME__/g, this.getPath().valueOf());
    targetPath.write(contents);
    targetPath.chmod(0755);
}

Workspace.prototype.init = function() {
    if(this.exists()) {
        throw new Error("Workspace already exists at: " + this.getPath());
    }
    try {
        if(this.hasVendorInfo()) {
            if(this.getVendorInfo().vendor.hasRepository(this.getVendorInfo())) {
                throw new Error("Repository already exists on vendor site");
            }
        }
        var path = this.getPath();
        path.mkdirs();
        
        var git = GIT.Git(path);
        git.init();
        
        if(this.hasVendorInfo()) {
            if(!this.getVendorInfo().vendor.createRepository(this.getVendorInfo())) {
                throw new Error("Error creating repository on vendor site");
            }
        }
        
        var descriptor = {
            "name": path.basename().valueOf()
        };
        if(this.hasVendorInfo()) {
            descriptor.repositories = [
                {
                    "type": "git",
                    "url": this.getVendorInfo().vendor.getPublicRepositoryUrl(this.getVendorInfo())
                }
            ];
        }
        path.join("package.json").write(JSON.encode(descriptor, null, "    "));
        path.join(".gitignore").write([
            ".DS_Store",
            ".tmp*",
            "*.local.*",
            "/using/",
            "/.build/",
            "/.pinf-workspace.json",
            "/bin/.pinf-activate-workspace"
        ].join("\n"));

        git.add(path.join("package.json"));
        git.add(path.join(".gitignore"));
        git.commit("first commit");
        if(this.hasVendorInfo()) {
            git.remoteAdd("origin", this.getVendorInfo().vendor.getPrivateRepositoryUrl(this.getVendorInfo()));
            git.push("origin", "master");
        }
    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}

Workspace.prototype.destroy = function() {
    // NOTE: This removes all local traces of the workspace.
    //       It does NOT touch the repository on the vendor site.
    OS.command("rm -Rf " + this.getPath());
}


Workspace.prototype.checkout = function() {
    if(this.exists()) {
        throw new Error("Workspace already exists at: " + this.getPath());
    }
    try {
        if(!this.getVendorInfo().vendor.hasRepository(this.getVendorInfo())) {
            throw new Error("Repository does not exist on vendor site");
        }

        var path = this.getPath();
        path.mkdirs();

        var url = this.getVendorInfo().vendor.getRepositoryUrl(this.getVendorInfo());

        var git = GIT.Git(path);
        git.clone(url);

        // TODO: pinf map-sources

    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}

Workspace.prototype.isForked = function() {
    var info = this.getVendorInfo().vendor.getRepositoryInfo(this.getVendorInfo());
    if(!info) {
        throw new Error("Error getting repository info from vendor");
    }
    if(!UTIL.has(info, "forked")) {
        throw new Error("Repository info does not contain 'forked' property");
    }
    return info.forked;
}

Workspace.prototype.switchTo = function() {
    // NOTE: This can only be run from the command line
    // TODO: Verify that we are running from the command line

    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }

    if(!this.hasPlatform()) {
        var spec = this.getDescriptor().getPinfSpec();
        if(spec.platforms && spec.platform && spec.platforms[spec.platform]) {
            var locator = LOCATOR.PackageLocator(spec.platforms[spec.platform]),
                platform = PINF.getPlatformForLocator(locator);
            if(!platform.exists()) {
                platform.init(locator);
            }
            this.setPlatform(platform);
        } else {
            this.setPlatform(PINF.getDefaultPlatform());
        }
    } else {
        var platform = this.getPlatform();
        if(!platform.exists()) {
            throw new Error("Platform does not exist at: " + platform.getPath());
        }
    }

    // NOTE: This will enter a new shell
    OS.system(this.getPath().join("bin", ".pinf-activate-workspace").valueOf());
}

Workspace.prototype.getRevisionControl = function() {
    return GIT.Git(this.getPath());
}

// TODO: Deprecate in favor of this.getRevisionControl()
Workspace.prototype.getRevisionControlBranch = function() {
    return this.getRevisionControl().getActiveBranch();
}


Workspace.prototype.forEachPackage = function(callback, subPath) {
    var path = this.path,
        self = this;
    if(subPath) {
        path = path.join(subPath);
    }
    path.listPaths().forEach(function(item) {
        if(item.basename()=="package.json") {
            callback(PACKAGE.Package(item.dirname()));
        } else
        if(item.isDirectory()) {
            self.forEachPackage(callback, (subPath)?subPath.join(item.basename()):item.basename());
        }
    });
}