# Project structure

The following project structure is created during the PDK installation.

**public/docs**

Folder where the documentation site for your project is defined and built.

!!! note

    As `nx` has an issue with root projects being called **docs**, we chose the name **public**.

**private**

This folder contains classes which are to be used locally by the root package.

**private/projects**

This folder contains configurations for each project within this monorepo.

!!! info

    Every package in the monorepo should correspond to a file in this directory.

**packages**

This is the folder where each of the projects are synthesized. Each package in this subdirectory should be `public`, and published to each of the supported package managers.