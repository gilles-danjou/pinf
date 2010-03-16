*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

Installing PINF
===============

To use pinf you need to install the [PINF command line tool](http://github.com/cadorn/pinf/blob/master/docs/CLI.md).

Requirements:

  * UNIX (Only Mac OSX is tested)
  * java
  * git


Versioned release
-----------------

Coming soon!


From source
-----------

Get the sources and build the PINF command:

    cd ~
    mkdir pinf
    cd pinf
    mkdir bootstraps
    cd bootstraps
    git clone git://github.com/cadorn/narwhal.git narwhal
    cd narwhal
    git branch --track experimental origin/experimental
    git checkout experimental
    cd ..
    export PATH=~/pinf/bootstraps/narwhal/bin:$PATH
    git clone git://github.com/cadorn/util.git util
    git clone git://github.com/cadorn/pinf.git pinf
    export PATH=~/pinf/bootstraps/pinf/bin:$PATH
    pinf-local build-program ~/pinf/bootstraps/pinf/programs/cli

The built binary is available at (substitute `<VERSION>` with the actual directory name):

    ~/pinf/programs/registry.pinf.org/cadorn.org/github/pinf/programs/cli/<VERSION>/bin/pinf

Put it on your `PATH` in `/etc/profile`, `~/.bash_profile` or equivalent:

    export PATH=~/pinf/programs/registry.pinf.org/cadorn.org/github/pinf/programs/cli/<VERSION>/bin:$PATH

Run the test suite:

    pinf test

Now proceed with the *Post install* steps.


Post install
------------

PINF integrates with github and at the moment you are required to configure a github account. This requirement will
be removed in future and other vendors will be supported in addition to github.

Place the following into `~/pinf/config/credentials.json`:

    {
        "default": {
            "http://github.com/api/": {
                "login": "<username>",
                "token": "<token>"
            }
        }
    }

You can get your github API token from your account page: [https://github.com/account](https://github.com/account)

