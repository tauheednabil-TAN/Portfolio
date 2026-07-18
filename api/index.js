import mod from "../dist/server.cjs";

// dist/server.cjs is a CommonJS bundle; default-importing it from ESM
// gives us module.exports, which contains the Express app.
const app = mod.app || mod.default?.app || mod;

export default app;
