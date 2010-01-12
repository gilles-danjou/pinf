

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var FILE = require("file");
var OS = require("os");
var SEMVER = require("semver", "util");

var Git = exports.Git = function(path) {
    if (!(this instanceof exports.Git))
        return new exports.Git(path);

    this.path = path;
    this.rootPath = null;

    var result = this.runCommand('git rev-parse --git-dir');
    if(result && result.substr(0,27)!="fatal: Not a git repository") {        
        this.rootPath = FILE.Path(result).dirname();
    }
}

Git.prototype.initialized = function() {
    return (this.rootPath!==null);
}

Git.prototype.runCommand = function(command) {

    command = "cd " + this.path.valueOf() + "; " + command;
    
    var process = OS.popen(command);
    var result = process.communicate();
    var stdout = result.stdout.read();
    var stderr = result.stderr.read();
    if (result.status === 0 || (result.status==1 && !stderr)) {
        return UTIL.trim(stdout);
    }
    throw new Error("Error running command (status: "+result.status+") '"+command+"' : "+stderr);
}


Git.prototype.getLatestVersion = function(majorVersion) {
    if(!this.initialized()) return false;

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
    if(!this.initialized()) return false;

    var result = this.runCommand('git log --no-color --pretty=format:"%H" -n 1 ' + branch);
    if(!result) {
        return false;
    }
    return UTIL.trim(result);
}

Git.prototype.getFileForRef = function(revision, path) {
    if(!this.initialized()) return false;
    var path = this.path.join(path);
    var result = this.runCommand('git show ' + revision + ':' + this.rootPath.join(".").relative(path));
    if(!result) {
        return false;
    }
    return result;
}
