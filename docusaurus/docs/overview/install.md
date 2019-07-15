---
id: install
title: Installation
sidebar_label: Installation
---

You may either download prebuilt binaries of the ISLE editor or built it yourself from the source code. The latter is only recommended in case you would like to contribute to the development of ISLE or be able to pull in the latest features.

## Binaries

Current version: _v0.20.1_.

| OS      | x64 | ia32 |
| ------- | --- | --- |
| Linux   | [Download][linux-x64] | [Download][linux-ia32] |
| OS X    | [Download][darwin-x64] |  |
| Windows | [Download][win32-x64] | [Download][win32-ia32] |

## Build from Source

### Prerequisites

Developing and running the ISLE Editor has the following prerequisites:

* [git][git]: version control
* [Node.js][node-js]: JavaScript runtime (version `>= 9.0`)

### Download

To acquire the source code, clone the git repository.

``` bash
$ git clone https://github.com/isle-project/isle-editor
```

### Installation

To install development dependencies,

``` bash
$ npm install
```

### Development

To live-edit the ISLE Editor,

``` bash
$ npm run dev
```

Editing source files will result in changes appearing directly without reloading.

### Build

To build the [Electron][electron] application,

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

To bundle the editor as a standalone application for all operating systems, you will need the following:

* On macOS/Linux, the `unzip` program and [wine][wine] (version `>= 1.6`), a tool for running Windows applications
* On Windows, both [.NET Framework 4.5 or higher and Powershell 3 or higher][windows-reqs]

#### Tests

The ISLE editor uses [Jest][jest] for unit tests. To run the tests, execute the following command in the top-level application directory:

``` bash
$ npm test
```

To only run the tests for a single component or function, use

```bash
$ npm run test -- -t "name-of-spec"
```

[electron]: http://electron.atom.io/
[git]: http://git-scm.com/
[jest]: https://jestjs.io
[wine]: https://www.winehq.org/
[wine]: https://www.winehq.org/
[windows-reqs]: https://github.com/feross/cross-zip#windows-users
[node-js]: https://nodejs.org/en/

[darwin-x64]: https://github.com/isle-project/isle-editor/releases/download/v0.20.1/ISLE.Editor-darwin-x64.zip
[linux-x64]: https://github.com/isle-project/isle-editor/releases/download/v0.20.1/ISLE.Editor-linux-x64.zip
[linux-ia32]: https://github.com/isle-project/isle-editor/releases/download/v0.20.1/ISLE.Editor-linux-ia32.zip
[win32-ia32]: https://github.com/isle-project/isle-editor/releases/download/v0.20.1/ISLE.Editor-win32-ia32.zip
[win32-x64]: https://github.com/isle-project/isle-editor/releases/download/v0.20.1/ISLE.Editor-win32-x64.zip