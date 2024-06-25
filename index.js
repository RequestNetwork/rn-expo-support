import { Buffer } from "buffer";
global.Buffer = Buffer;
import "react-native-get-random-values";
import cryptoPolyfill from "./cryptoPolyfill";

if (typeof global.crypto !== "object") {
  global.crypto = {};
}

Object.assign(global.crypto, cryptoPolyfill);

// Ensure these are available globally
global.crypto.randomBytes = cryptoPolyfill.randomBytes;
global.randomBytes = cryptoPolyfill.randomBytes;

// Mimic CommonJS style export
global.crypto.default = cryptoPolyfill;
import EventEmitter from "eventemitter3";
global.EventEmitter = EventEmitter;
import { Readable, Writable } from "stream-browserify";
global.Readable = Readable;
global.Writable = Writable;

// Starting expo router
import "expo-router/entry";
