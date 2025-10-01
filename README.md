# Element Portable

Truly portable Matrix client for desktop platforms. Use it on flash drives, different systems or mounted volumes: no data is saved to appdata/keystores or other locations on your computer outside app folder - you can just copy it to different location and Element will work like a charm!



# Installation

The installation instructions are simplified and shortened as much as possible for a quick start. Full instruction can be found in the [original repository](https://github.com/element-hq/element-desktop?tab=readme-ov-file#first-steps).

## Simplest way

Go to [releases page](https://github.com/Temporalitas/element-portable/releases), download latest executable for your platform, then move the file to a separate folder (since it will contain all the application data after launch) and you're done.

## Building from source

### First steps

Download repository and set it as current working directory:

```
git clone https://github.com/Temporalitas/element-portable && cd element-portable
```

Install [Node](https://nodejs.org/en) with npm, then Yarn and fetch the dependencies:

```
npm i -g yarn
yarn install
```

### Setup Element Web

Since this package is just the Electron wrapper for Element Web, it doesn't contain any of the Element Web code,
so the first step is to get an actual working copy of Element Web. Simplest way of doing this:

```
yarn run fetch --noverify --cfgdir ""
```

Packaged Element should have a configuration file with default Matrix server, integrations server, call API and so on. Official configuration can be found [here](https://github.com/Temporalitas/element-portable/blob/develop/element.io/release/config.json) and can be added with one command:

```
yarn run fetch --noverify --cfgdir ./element.io/release
```

Also, you can create a config yourself or edit default config located in `./element.io/release`, then run:

```
mkdir myconfig
cp /path/to/my/config.json myconfig/
yarn run fetch --noverify --cfgdir myconfig
```

### Native modules (optional)

If you want message searching in your Matrix client, only possible option is to build it with [matrix-seshat](https://github.com/matrix-org/seshat). **If no, skip this article.**

To build it, you need install the following tools on your system:

1. [Python 3](https://www.python.org/downloads/)
2. [Perl](https://strawberryperl.com/)
3. [Rust](https://rustup.rs/)
4. [NASM](https://www.nasm.us/)

I'm assuming you already have Node and Git installed at the required versions since you've gotten this far.

Then, simple build command:

```
yarn build:native
```

**NB!** It will fail on file system that doesn't support symlinks (ExFAT, FAT32 etc). 

### Final build

##### Windows

Open `cmd` as administrator and just run the command:

```
yarn build:portable
```

Executable will be in the *./dist* folder. You can copy it anywhere and start using.

##### Linux

```
yarn build:portable:linux
```

Application will be in *.AppImage* file in *./dist* folder. You can copy it anywhere and start using, but you should call it from terminal with specific startup parameters: `./Element-Portable.AppImage --appimage-extract-and-run --no-sandbox`

# Profiles

To run multiple instances of the desktop app for different accounts, you can
launch the executable with the `--profile` argument followed by a unique
identifier, e.g `element-desktop --profile Work` for it to run a separate profile and
not interfere with the default one.



## Copyright & License

Copyright (c) 2016-2017 OpenMarket Ltd

Copyright (c) 2017 Vector Creations Ltd

Copyright (c) 2017-2025 New Vector Ltd

This software is multi licensed by New Vector Ltd (Element). It can be used either:

(1) for free under the terms of the GNU Affero General Public License (as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version); OR

(2) for free under the terms of the GNU General Public License (as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version); OR

(3) under the terms of a paid-for Element Commercial License agreement between you and Element (the terms of which may vary depending on what you and Element have agreed to).
Unless required by applicable law or agreed to in writing, software distributed under the Licenses is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the Licenses for the specific language governing permissions and limitations under the Licenses.
