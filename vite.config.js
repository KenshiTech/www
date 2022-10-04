import { sveltekit } from "@sveltejs/kit/vite";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path from "path";

const MODE = process.env.NODE_ENV;

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    // ↓ Have to check the mode here because this cant run on build
    MODE === "development"
      ? nodePolyfills({
          include: [
            "node_modules/**/*.js",
            new RegExp("node_modules/.vite/.*js"),
          ],
        })
      : "",
  ],
  optimizeDeps: {
    include: ["@web3-onboard/core"],
  },
  build: {
    rollupOptions: {
      plugins: [
        // ↓ Needed for build
        nodePolyfills(),
      ],
    },
    // ↓ Needed for build
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/@web3-onboard/, /node_modules/],
    },
  },
  resolve: {
    alias: {
      src: path.resolve("./src"),
      // ↓ see https://github.com/vitejs/vite/issues/6085
      "@ensdomains/address-encoder":
        "@ensdomains/address-encoder/lib/index.umd.js",
    },
  },
  define: {
    "process.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
  },
};

export default config;
