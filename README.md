# 🗻 Fuji App

## 📖 Introduction
The Fuji App it's a web application that helps interact with Fuji, a decentralized synthetic asset protocol, combining Liquid and Lightning Network to allow users to mint synthetic assets and trade them in a trustless way.

## 📦 Installation
To install the Fuji App, you need to have Node.js installed in your machine. Then, you can clone the repository and install the dependencies with the following commands:
```bash
yarn install
```

## 🚀 Usage
To run the Fuji App in development, you can use the following command:
```bash
yarn dev
```

To build the Fuji App for production, you can use the following command:
```bash
yarn build
```

## 🧪 Test

The app is using [Playwright](https://playwright.dev/) to test UI interactions. Tests should be located in the `tests` folder with the `.spec.ts` extension.

### Downloads the testing browser extensions

Fuji App needs some browser extension wallets to be installed. `test:init` script downloads them for you.  The extensions are downloaded in the `tests` folder and should not be committed.

```bash
# DL the extensions for testing, only needed once
yarn test:init
```

### Run the tests

```bash
yarn test
```

## 📝 License
The Fuji App is licensed under the [MIT License](LICENSE.md)



