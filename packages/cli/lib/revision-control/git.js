

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var FILE = require("file");
var OS = require("os");
var SEMVER = require("semver", "util");

var Git = exports.Git = function(path) {
    if (!(this instanceof exports.Git))
        return new exports.Git(path);
    
    this.path = path;
}

Git.prototype.initialized = function() {
    return this.path.join(".git").isDirectory();
}

Git.prototype.runCommand = function(command) {
    
    command = "cd " + this.path.valueOf() + "; " + command;
    
    var process = OS.popen(command);
    var result = process.communicate();
    if (result.status !== 0) {
        //result.stderr.read()
        throw new Error("Error running command '"+command+"'");
    }

    return UTIL.trim(result.stdout.read());
}


Git.prototype.getLatestVersion = function(majorVersion) {
    var result = this.runCommand('git tag -l "v*"');
    if(!result) {
        return false;
    }
    var versions = UTIL.map(result.split("\n"), function(version) {
        return UTIL.trim(version).substr(1);
    });
    return SEMVER.latestForMajor(versions, majorVersion);
}


Git.prototype.getLatestRevisionForBranch = function(branch) {
    var result = this.runCommand('git log --no-color --pretty=format:"%H" -n 1 ' + branch);
    if(!result) {
        return false;
    }
    return UTIL.trim(result);
}
