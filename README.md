# ISLE Editor

#### Dependencies

[![Dependencies][dependencies-image]][dependencies-url] 
[![DevDependencies][dev-dependencies-image]][dev-dependencies-url]
[![DOI](https://zenodo.org/badge/61614893.svg)](https://zenodo.org/badge/latestdoi/61614893)

#### Tests

[![Build Status](https://travis-ci.com/isle-project/isle-editor.svg?branch=master)](https://travis-ci.com/isle-project/isle-editor)
[![codecov](https://codecov.io/gh/isle-project/isle-editor/branch/master/graph/badge.svg)](https://codecov.io/gh/isle-project/isle-editor) [![Greenkeeper badge](https://badges.greenkeeper.io/isle-project/isle-editor.svg)](https://greenkeeper.io/)

## Introduction

A desktop-application that can be used to author and preview *integrated statistics learning environment* (ISLE) lessons before they are deployed online. Other parts of the ISLE environment are: 

-   the [isle-server][isle-server] is the server program responsible for user management and data storage
-   the [isle-dashboard][isle-dashboard] is the online dashboard used to deploy, organize and monitor ISLE lessons

#### [Open Documentation][docs]

## Installation

### Binaries

Current version: v0.38.1.

[Download the isle-editor for Windows (.exe)][windows]

[Download the isle-editor for macOS (.dmg)][macOS]

[Download the isle-editor for Linux (.AppImage)][linux-appimage] (alternative: [.deb][linux-deb])

### Build from Source

#### Prerequisites

Developing and running the ISLE Editor has the following prerequisites:

* [git][git]: version control
* [Node.js][node-js]: JavaScript runtime (version `>= 9.0`)

#### Download

To acquire the source code, clone the git repository.

``` bash
$ git clone https://github.com/isle-project/isle-editor
```

#### Installation

To install development dependencies,

``` bash
$ npm install
```

#### Development

To live-edit the ISLE Editor,

``` bash
$ npm run dev
```

Editing source files will result in changes appearing directly without reloading.

#### Build

To build and package the [Electron][electron] application,

``` bash
$ npm run build
```

The bundled version can be started with

``` bash
$ npm start
```

#### Package

To package the editor as a standalone application for the current operating system, run 

``` bash
$ npm run package
```

To bundle for all operating systems, run

``` bash
$ npm run package-all
```

#### Tests

The ISLE editor uses [Jest][jest] for unit tests. To run the tests, execute the following command in the top-level application directory:

``` bash
$ npm test
```

To only run the tests for a single component or function, use

```bash
$ npm run test -- -t "name-of-spec"
```

## License

See [LICENSE][license].

## Icon Credits

The following icons are used under a Creative Commons CCBY license.

- "Confused" by Greg Pabst
- "Lightbulb" by Jeremy J Bristol
- "Microphone" by Aleksandr Vector
- "Positive Feedback Loop" by Richard Slater
- "bar chart" by Barracuda
- "Scatterplot" by JeraOcean
- "K-Means" by Knut M. Synstad from the Noun Project
- "SVM", "k nearest Neighbours", "Classification tree graph", "Naive Bayes", "Random Forest", "Neural Networks" by sachin modgekar from the Noun Project
- "logistic regressions" by Christina Barysheva from the Noun Project
- "Lasso" by Sam Neckles from the Noun Project
- "net" by Lisa Oregioni from the Noun Project
- "detail roof shed ridge" by kloeg architecture from the Noun Project
- "linear regression" by Knut M. Synstad from the Noun Project
- "dimension" by Andreav from the Noun Project
- "bag" by Andrejs Kirma from the Noun Project
- "boost" by Yo! Baba from the Noun Project

[isle-dashboard]: https://github.com/isle-project/isle-dashboard
[isle-server]: https://github.com/isle-project/isle-server

[electron]: http://electron.atom.io/
[git]: http://git-scm.com/
[jest]: https://jestjs.io
[license]: https://raw.githubusercontent.com/isle-project/isle-editor/master/LICENSE.md
[node-js]: https://nodejs.org/en/

[macOS]: https://github.com/isle-project/isle-editor/releases/download/v0.38.1/isle-editor-0.38.1.dmg
[linux-appimage]: https://github.com/isle-project/isle-editor/releases/download/v0.38.1/isle-editor-0.38.1-x86_64.AppImage
[linux-deb]: https://github.com/isle-project/isle-editor/releases/download/v0.38.1/isle-editor-0.38.1-amd64.deb
[windows]: https://github.com/isle-project/isle-editor/releases/download/v0.38.1/isle-editor-Setup-0.38.1.exe

[dependencies-image]: https://img.shields.io/david/isle-project/isle-editor.svg
[dependencies-url]: https://david-dm.org/isle-project/isle-editor/master

[dev-dependencies-image]: https://img.shields.io/david/dev/isle-project/isle-editor.svg
[dev-dependencies-url]: https://david-dm.org/isle-project/isle-editor/master?type=dev

[docs]: https://isledocs.com/
