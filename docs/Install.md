
Installing PINF
===============

To use pinf you need to install the PINF command line tool.

Requirements:

  * UNIX (Only Mac OSX is tested)
  * git
  * java


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

Now run the test suite:

    pinf test
