// cryptoPolyfill.js
import nacl from "tweetnacl";
import forge from "node-forge";
import { Buffer } from "buffer";

const randomBytes = (size) => {
  if (typeof size !== "number") {
    throw new TypeError("Expected number");
  }
  return Buffer.from(nacl.randomBytes(size));
};

const cryptoPolyfill = {
  randomBytes,
  createHash: (algorithm) => {
    return {
      update: (data) => {
        const md = forge.md[algorithm].create();
        md.update(
          typeof data === "string" ? data : forge.util.createBuffer(data)
        );
        return {
          digest: () =>
            forge.util.createBuffer(md.digest().getBytes(), "raw").getBytes(),
        };
      },
    };
  },
  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    try {
      const derivedKey = forge.pkcs5.pbkdf2(
        password,
        salt,
        iterations,
        keylen,
        digest
      );
      callback(null, Buffer.from(derivedKey, "binary"));
    } catch (error) {
      callback(error);
    }
  },
  randomFillSync: (buffer, offset, size) => {
    const randomBytes = nacl.randomBytes(size);
    buffer.set(randomBytes, offset);
    return buffer;
  },
};

// Ensure commonJS style exports are available
cryptoPolyfill.default = cryptoPolyfill;
module.exports = cryptoPolyfill;

export default cryptoPolyfill;
