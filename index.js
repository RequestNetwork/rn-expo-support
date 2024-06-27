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
