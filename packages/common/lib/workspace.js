

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var OS = require("os");
var PACKAGE = require("./package");
var PINF = require("./pinf");
var GIT = require("git", "util");
var FILE = require("file");
var JSON_STORE = require("json-store", "util");
var TERM = require("term");


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
        if(this.vendorInfo) {
            if(this.vendorInfo.vendor.hasRepository(this.vendorInfo)) {
                throw new Error("Repository already exists on vendor site");
            }
        }
        var path = this.getPath();
        path.mkdirs();
        
        var git = GIT.Git(path);
        git.init();
        
        if(this.vendorInfo) {
            if(!this.vendorInfo.vendor.createRepository(this.vendorInfo)) {
                throw new Error("Error creating repository on vendor site");
            }
        }
        
        var descriptor = {
            "name": path.basename().valueOf()
        };
        if(this.vendorInfo) {
            descriptor.repositories = [
                {
                    "type": "git",
                    "url": this.vendorInfo.vendor.getPublicRepositoryUrl(this.vendorInfo)
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
        if(this.vendorInfo) {
            git.remoteAdd("origin", this.vendorInfo.vendor.getPrivateRepositoryUrl(this.vendorInfo));
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
    if(!this.vendorInfo) {
        throw new Error("No vendor info for workspace");
    }
    try {
        if(!this.vendorInfo.vendor.hasRepository(this.vendorInfo)) {
            throw new Error("Repository does not exist on vendor site");
        }

        var path = this.getPath();
        path.mkdirs();

        var url = this.vendorInfo.vendor.getRepositoryUrl(this.vendorInfo);

        var git = GIT.Git(path);
        git.clone(url);

    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}


Workspace.prototype.switchTo = function() {
    // NOTE: This can only be run from the command line
    // TODO: Verify that we are running from the command line

    if(!this.exists()) {
        throw new Error("Workspace not found at: " + this.getPath());
    }
    
    if(!this.hasPlatform()) {
        this.setPlatform(PINF.getDefaultPlatform());
    }

    // NOTE: This will enter a new shell
    OS.system(this.getPath().join("bin", ".pinf-activate-workspace").valueOf());
}


Workspace.prototype.getRevisionControlBranch = function() {
    return GIT.Git(this.getPath()).getActiveBranch();
}
