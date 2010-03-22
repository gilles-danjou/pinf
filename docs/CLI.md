*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

PINF Command Line Tool
======================

The PINF command line tool is the primary method of interacting with the PINF platform. Some commands operate at
the level of the entire PINF installation and other commands work specifically within workspaces and on packages.

The following commands have been implemented:

    PINF[pinf]: pinf -h
    Usage: pinf [OPTIONS] COMMAND
    PINF - A Toolchain Automation Platform
      activate-platform: Activate a platform for a workspace
      announce-release: Announce a new release of a package
      build-program: Build a program package
      checkout-workspace: Checkout an existing workspace
      create-workspace: Create a new workspace
      install-platform: Install a platform
      launch-program: Launch a program package
      list-platforms: List all installed platforms
      map-sources: Map packages and catalogs to workspaces
      publish-program: Publish a program package
      register-namespace: Register a namespace on a registry server
      register-package: Register a package to a namespace
      show-workspaces: Show information about all workspaces
      switch-workspace: Enter a workspace
      test-package: Test a package
      test: Execute a test suite
      update-catalogs: Update all catalogs
      update-platform: Update a platform
     --db DB: Path to PINF database
     -h --help: displays usage information (final option)


Command Reference
-----------------

*NOTE: These docs are a work in progress.*

Assumptions:

    ~/pinf/workspaces/github.com/cadorn/pinf/package.json                   // PINF workspace
    ~/pinf/workspaces/github.com/cadorn/pinf/packages/common/package.json   // PINF sub-package


### pinf create-workspace ###

    pinf create-workspace http://github.com/cadorn/pinf/

Create a github project and checkout the workspace.


### pinf switch-workspace ###

    pinf switch-workspace github.com/cadorn/pinf 
    pinf switch-workspace github.com/cadorn/pinf:packages/common

Enter a new shell/virtual environment maintained by PINF for the specified package.


### pinf register-namespace ###

    pinf register-namespace http://registry.pinf.org/christoph@christophdorn.com/github/pinf/
    pinf register-namespace --user christoph@christophdorn.com http://registry.pinf.org/cadorn.org/github/pinf/

Register a namespace you control on the PINF registry server.


### pinf register-package ###

    pinf register-package cadorn.org/github/pinf ~/pinf/workspaces/github.com/cadorn/pinf
    pinf register-package cadorn.org/github/pinf .      // from workspace (github.com/cadorn/pinf)

Register a package to a namespace you control on the PINF registry server. This will insert a `uid` property
into `package.json` for the package you registered. Registration requires you to have the following
minimum properties set:

    package.json ~ {
        "name": "pinf",
        "repositories": [
            {
                "type": "git",
                "url": "git://github.com/cadorn/pinf.git",
            }
        ]
    }

### pinf announce-release ###

    pinf announce-release --branch master ~/pinf/workspaces/github.com/cadorn/pinf
    pinf announce-release .     // from workspace (github.com/cadorn/pinf)

Announces a new package revision to the registry server for the given branch. This is used to collaborate during
active development. The package may be located via:

    package.json ~ {
        "using": {
            "pinf": {
                "catalog": "http://registry.pinf.org/cadorn.org/github/catalog.json",
                "name": "pinf",
                "revison": "master"
            }
        }
    }

