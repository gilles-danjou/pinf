The PINF Lifecycle
==================

Assumptions
-----------

Registry Servers:

  * http://registry.public.org/ - *public read, public write*
  * http://registry.private.org/ - *public read, private write*
  * http://registry.private.com/ - *private read, private write*

*NOTE: The registry does not host package archives, only package and catalog descriptors.*

Setup
-----

Register namespaces to your system with:

    pinf register-namespace http://registry.public.org/<owner>/public/
    pinf register-namespace http://registry.private.org/<owner>/company/
    pinf register-namespace http://registry.private.com/<owner>/private/

Where `<owner>` is an email address or hostname and the remaining `path` is of your choosing.
Combined the `<owner>`/`path` make up the `namespace` which is unique to the registry server
and your local system.

!!!Email Owners

If you do not have an account (for the `<owner>` email address) on the registry server
you will receive an email with an access code. Include this access code with your first query:

  pinf register-namespace --authkey <AccessCode> http://registry.public.org/<owner>/public/

!!!Hostname Owners

When registering a namespace for a hostname `<owner>` you need to include a `--user`:
	
    pinf register-namespace --user <Email> http://registry.public.org/<owner>/public/
	
If you do not have an account (for the `--user`) on the registry server
you will receive an email with an access code.

Once your user account is created you will receive a second email with instructions on how to
prove that you control the hostname you provided. This involves placing
a file on the hostname with a given name and contents.

*NOTE: Choose a hostname that is short and easy to remember as users will see it all the time.*

Registering Packages
--------------------

Add a [package](http://wiki.commonjs.org/wiki/Packages/0.1) to the registry:

	pinf register-package <Namespace> <PackageName>

Where `<Namespace>` is the `<owner>`/`path` from above.

For example:

	pinf register-package <owner>/public my-package

Will result in:

	http://registry.public.org/<owner>/public/my-package/package.json

*NOTE: `my-package` is referring to the package's directory containing a package.json file.*

Publishing Packages
-------------------

Publish a package with:

	pinf announce-package my-package

*NOTE: `my-package` is referring to the package's directory containing a package.json file.*

pinf (the toolchain management tool) will get the last version from the version control system (only git at this time) by looking for [SemVer](http://semver.org/) tags (e.g. `v3.1.0`) and announce this to the registry server.

The resulting registry URL will be:

	http://registry.public.org/<owner>/public/my-package/releases/v3.1.0/package.json

Installing Packages Directly
----------------------------

**TODO**

Installing Packages via Catalogs
--------------------------------



