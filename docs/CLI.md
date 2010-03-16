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

A command reference is coming soon.
