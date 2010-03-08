
Installing PINF
===============

To use pinf you need to install the PINF command line tool.

Requirements:

  * UNIX (Only Mac OSX is tested)
  * git
  * java


The easy way
------------

Coming soon!


From source
-----------

Get the source and build the PINF command:

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
    git clone git://github.com/cadorn/util.git util
    export PATH=~/pinf/bootstraps/narwhal/bin:$PATH
    git clone git@github.com:cadorn/pinf.git pinf
    export PATH=~/pinf/bootstraps/pinf/bin:$PATH
    pinf-local build-program ~/pinf/bootstraps/pinf/packages/cli

The built binary is available at:

    ~/pinf/programs/registry.pinf.org/cadorn.org/github/pinf/programs/cli/master/bin/pinf

Add it to your `PATH` in `/etc/profile`, `~/.bash_profile` or equivalent:

    export PATH=~/pinf/programs/registry.pinf.org/cadorn.org/github/pinf/programs/cli/master/bin:$PATH

Now run the test suite:

    pinf test
