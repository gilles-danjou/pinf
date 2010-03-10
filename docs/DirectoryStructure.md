*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

PINF Directory Structure
========================

PINF works by jailing everything in a directory tree rooted on a PINF home directory. By default there is one
PINF installation per user on a system with the PINF home directory located at `~/pinf/` *(Note: Multiple users using PINF on one system has
not been addresses as of yet)*.

Once PINF is installed on a given path it **may not be relocated**. This is because the absolute path to the PINF home directory is
compiled into many PINF-controlled files. This mode of operation is essential to allow files to be referenced
from many different scripts and contexts. You can relocate a PINF home directory only by cleaning the setup and rebuilding everything. This may
sound cumbersome but it is not. PINF automates your toolchain and thus keeps track of everything allowing it to re-build itself at
a different path on the same system or on a different system *(Note: Relocation functionality has not yet been implemented)*.


Philosophy
----------

PINF forces a developer to compartmentalize a project into packages. The packages are transformed and tested
in a sterile environment maintained by PINF within the PINF home directory. This provides the developer with a
`master code stack` that is atomic, automatically constructed, consistent and repeatable over time. It is also completely reflective
allowing build and analysis tools to be seamlessly integrated.

To pull code out of the `master code stack` for the purpose of distributing it outside of PINF one employs publishers. Publishers take built
packages at given revisions and bundles them into appropriate distribution formats. During this process PINF-specific idioms and meta data may
be stripped although it is recommended to maintain a certain base knowledge of PINF conventions and standards in distributed code as it allows tying distributed production code into the development lifecycle.


Directories
-----------

Authoritative:

  * `~/pinf/config/` - Configuration files for PINF and toolchain packages primarily used to create ties with the environment.
  * `~/pinf/notes/` - Notes for toolchain packages and other concerns.
  * `~/pinf/workspaces/` - The source code for packages.

Dynamically generated and maintained by PINF (**DO NOT MODIFY**):

  * `~/pinf/bootstraps/` - Projects required to bootstrap PINF on a system during installation.
  * `~/pinf/builds/` - Built packages.
  * `~/pinf/catalogs/` - Cached package catalogs downloaded from the internet.
  * `~/pinf/data/` - Any and all kinds of data for toolchain packages.
  * `~/pinf/downloads/` - Cached files downloaded from the internet.
  * `~/pinf/packages/` - Cached packages organized for easy referencing.
  * `~/pinf/platforms/` - Platform packages used in workspace workflows and package building.
  * `~/pinf/programs/` - Built program packages callable from the outside.


In depth: `~/pinf/config/`
--------------------------

The config directory contains several PINF-specific configuration files:

    ~/pinf/config/*.json

For PINF configuration information see [Configuration](http://github.com/cadorn/pinf/blob/master/docs/Configuration.md).

Package specific configuration files are organized according to:

	~/pinf/config/ <UID> /

Where `<UID>` is the package UID (see [Namespaces](http://github.com/cadorn/pinf/blob/master/docs/Namespaces.md)). The organization
of configuration files for a package is left up to the package.


In depth: `~/pinf/workspaces/`
--------------------------

[Workspaces](http://github.com/cadorn/pinf/blob/master/docs/Workspaces.md) contain source packages and are organized according to:

	~/pinf/workspaces/ <Namespace> / <Name> / <Branch> /

Where `<Namespace>` is a path used to group workspaces into meaningful collections typically dictated by
[vendors](http://github.com/cadorn/pinf/blob/master/docs/Vendors.md) and based on where the source can be located on the internet.
`<Name>` is the unique local name of the package in the `<Namespace>` and `<Branch>` is an optional level allowing multiple working branches
of the same source package to coexist.


In depth: `~/pinf/builds/`
--------------------------

[Package](http://github.com/cadorn/pinf/blob/master/docs/Packages.md) builds are organized according to:

	~/pinf/builds/ <UID> / <Revision> / <Target> /

Where `<UID>` is the package UID (see [Namespaces](http://github.com/cadorn/pinf/blob/master/docs/Namespaces.md)),
`<Revision>` is the package revision (see [Versioning](http://github.com/cadorn/pinf/blob/master/docs/Versioning.md)) and
`<Target>` is the build target containing a valid [Package](http://github.com/cadorn/pinf/blob/master/docs/Packages.md).
	
By default PINF generates a `raw` target package with the following directories of interest:

  * `bin/` - Executable commands and scripts callable from the outside.
  * `using/` - Collected using-package dependencies for package
  * `packages/` - Collected system-package dependencies for package

Additional targets are [generated](http://github.com/cadorn/pinf/blob/master/docs/BuildFlow.md) via [builders](http://github.com/cadorn/pinf/blob/master/docs/Builders.md) based on the `raw` target. Builders can for example
strip a bunch of dependency packages from the package for target environments that already provide these.

