# Request Network Integration in React Native with Expo

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Setup](#setup)
4. [Polyfills and Configurations](#polyfills-and-configurations)
5. [Important Notes](#important-notes)

## Introduction

This project demonstrates how to integrate Request Network into a React Native application using Expo. Due to the differences between Node.js and React Native environments, several polyfills and configurations are necessary to make Request Network work properly.

## Installation

1. Create a new Expo project:

```bash
expo init request-network-demo
cd request-network-demo
```

2. Install necessary dependencies:

```bash
npm install @requestnetwork/request-client.js @requestnetwork/types @requestnetwork/payment-processor @requestnetwork/epk-signature buffer eventemitter3 stream-browserify http-browserify https-browserify react-native-get-random-values tweetnacl node-forge ethers@5.5.1
```

## Setup

1. Create a new file named `index.js` in the root of your project:

```bash
touch index.js
```

2. Add the following content to `index.js`:

```javascript
// Buffer polyfill
import { Buffer } from "buffer";
global.Buffer = Buffer;

import "react-native-get-random-values";

// Crypto Polyfill
import cryptoPolyfill from "./cryptoPolyfill";
if (typeof global.crypto !== "object") {
  global.crypto = {};
}
Object.assign(global.crypto, cryptoPolyfill);

// Event Emitter polyfill
import EventEmitter from "eventemitter3";
global.EventEmitter = EventEmitter;

// Stream Polyfill
import { Readable, Writable } from "stream-browserify";
global.Readable = Readable;
global.Writable = Writable;

// HTTP Polyfill
import http from "http-browserify";
global.http = http;

// HTTPS Polyfill
import https from "https-browserify";
global.https = https;

// Starting expo router
import "expo-router/entry";
```

3. Create a file named `cryptoPolyfill.js` in the root of your project:

```bash
touch cryptoPolyfill.js
```

4. Add the content to `cryptoPolyfill.js` as shown in the provided code snippet:

```javascript
import nacl from "tweetnacl";
import forge from "node-forge";
import { Buffer } from "buffer";

const randomBytes = (size, callback) => {
  if (typeof size !== "number") {
    throw new TypeError("Expected number");
  }
  const bytes = Buffer.from(nacl.randomBytes(size));
  if (callback) {
    callback(null, bytes);
    return;
  }
  return bytes;
};

const createHash = (algorithm) => {
  const md = forge.md[algorithm.toLowerCase()].create();
  return {
    update: function (data) {
      md.update(
        typeof data === "string" ? data : forge.util.createBuffer(data)
      );
      return this;
    },
    digest: function (encoding) {
      const digest = md.digest().getBytes();
      return encoding === "hex"
        ? forge.util.bytesToHex(digest)
        : Buffer.from(digest, "binary");
    },
  };
};

const createCipheriv = (algorithm, key, iv) => {
  const cipher = forge.cipher.createCipher(
    algorithm,
    forge.util.createBuffer(key)
  );
  cipher.start({ iv: forge.util.createBuffer(iv) });
  let output = forge.util.createBuffer();

  return {
    update: (data) => {
      cipher.update(forge.util.createBuffer(data));
      output.putBuffer(cipher.output);
      return Buffer.from(output.getBytes(), "binary");
    },
    final: () => {
      cipher.finish();
      output.putBuffer(cipher.output);
      const result = Buffer.from(output.getBytes(), "binary");
      output.clear();
      return result;
    },
    getAuthTag: () => {
      if (algorithm.includes("gcm")) {
        return Buffer.from(cipher.mode.tag.getBytes(), "binary");
      }
      throw new Error("getAuthTag is only supported for GCM mode");
    },
  };
};

const createDecipheriv = (algorithm, key, iv) => {
  const decipher = forge.cipher.createDecipher(
    algorithm,
    forge.util.createBuffer(key)
  );
  decipher.start({ iv: forge.util.createBuffer(iv) });
  let output = forge.util.createBuffer();
  let authTag;

  return {
    update: (data) => {
      decipher.update(forge.util.createBuffer(data));
      output.putBuffer(decipher.output);
      return Buffer.from(output.getBytes(), "binary");
    },
    final: () => {
      decipher.finish();
      output.putBuffer(decipher.output);
      const result = Buffer.from(output.getBytes(), "binary");
      output.clear();
      return result;
    },
    setAuthTag: (tag) => {
      if (algorithm.includes("gcm")) {
        authTag = tag;
        decipher.mode.tag = forge.util.createBuffer(tag);
      } else {
        throw new Error("setAuthTag is only supported for GCM mode");
      }
    },
  };
};

const pbkdf2 = (password, salt, iterations, keylen, digest, callback) => {
  try {
    const derivedKey = forge.pkcs5.pbkdf2(
      password,
      salt,
      iterations,
      keylen,
      digest
    );
    const result = Buffer.from(derivedKey, "binary");
    if (callback) {
      callback(null, result);
    } else {
      return result;
    }
  } catch (error) {
    if (callback) {
      callback(error);
    } else {
      throw error;
    }
  }
};

const randomFillSync = (buffer, offset, size) => {
  const randomBytes = nacl.randomBytes(size);
  buffer.set(randomBytes, offset);
  return buffer;
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};

const cryptoPolyfill = {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomFillSync,
  timingSafeEqual,
};

cryptoPolyfill.default = cryptoPolyfill;

module.exports = {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
  pbkdf2,
  randomFillSync,
  timingSafeEqual,
};

export default cryptoPolyfill;
```

5. Create / Update `metro.config.js` to use the custom polyfills:

```javascript
const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  crypto: require.resolve("./cryptoPolyfill"),
  stream: require.resolve("stream-browserify"),
  buffer: require.resolve("buffer"),
  http: require.resolve("http-browserify"),
  https: require.resolve("https-browserify"),
};

module.exports = defaultConfig;
```

6. Update package.json to set the main entry point:

```json
{
  "name": "request-network-demo",
  "main": "./index.js",
  "version": "1.0.0",
  ...
}
```

7. Ensure that your app.json file includes the correct entry point:

```
{
  "expo": {
    "entryPoint": "./index.js",
    ...
  }
}
```

## Polyfills and Configurations

### Crypto Polyfill

We've created a custom crypto polyfill (`cryptoPolyfill.js`) to provide the necessary cryptographic functions. This polyfill uses `tweetnacl` and `node-forge` libraries to implement various cryptographic operations.

#### Why tweetnacl and node-forge?

1. `tweetnacl`:
   It's a fast, secure, and easy-to-use cryptography library.
   It provides a pure JavaScript implementation of the NaCl cryptography library.
   It's particularly useful for generating random bytes, which is essential for cryptographic operations.
2. `node-forge`:
   It provides a comprehensive set of cryptographic tools and utilities.
   It implements various cryptographic algorithms and protocols that are not natively available in React Native.
   It's used in our polyfill for operations like hashing, cipher creation, and PBKDF2 key derivation.

Using these libraries allows us to implement a more complete set of cryptographic functions that closely mimic the Node.js crypto module, which is not available in React Native.

#### Index.js Configuration

The `index.js` file sets up global polyfills for `Buffer`, `crypto`, `EventEmitter`, `streams`, `HTTP`, and `HTTPS`. This ensures that these Node.js-like APIs are available globally in the React Native environment.

#### Metro Configuration

We use `metro.config.js` to configure Metro, the JavaScript bundler used by React Native, to use our custom polyfills.

#### Benefits of using metro.config.js instead of babel.config.js

1. **Direct module resolution**: Metro allows us to directly specify module resolutions, which is crucial for our polyfills.
2. **Performance**: Metro is optimized for React Native and can provide faster build times compared to Babel for large projects.
3. **Simplicity**: For our use case of module aliasing and polyfills, Metro configuration is more straightforward and requires less setup than Babel plugins.
4. **Native to React Native**: Metro is the default bundler for React Native, so using its configuration aligns better with the React Native ecosystem.

## Important Notes

1. Ensure you're using compatible versions of React Native and Expo.
2. The crypto polyfill may not cover all use cases. Test thoroughly and adjust as needed.
3. Be cautious when handling private keys. Never expose them in your code or version control.
4. The example code uses environment variables for private keys. Ensure you set these up correctly and securely.
