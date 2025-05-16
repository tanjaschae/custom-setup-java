1. To start a new project, you need to initialize a package.json:
    
    `npm init -y`

2. Install TypeScript and necessary dependencies
```bash
   npm install --save-dev typescript @vercel/ncc @types/node
   npm install @actions/core
```
* typescript: TypeScript compiler.
* @vercel/ncc: Bundles TypeScript code into a single file for GitHub Actions.
* @types/node: TypeScript types for Node.js.
* @actions/core: GitHub Actions core library for interacting with GitHub Action inputs, outputs,

3. Create TypeScript configuration file tsconfig.json.
   
   Use one of following and adapt your file
```bash
npx tsc --init
npx tsc --init --rootDir src --outDir dist --target ES2020 --module commonjs --strict
```

4. This command runs the TypeScript compiler, using your project's tsconfig.json to compile the .ts files into .js.

```bash
npx tsc
```
npx ensures that you're using the local version of TypeScript (from node_modules) instead of a global one.
This avoids version conflicts and makes your project more portable and predictable.

5. Install and initialize Jest with TypeScript

```bash
npm install --save-dev jest ts-jest @types/jest typescript
npx ts-jest config:init
```

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
```

```json
"scripts": {
  "test": "jest",
  "compile": "tsc",
  "build": "ncc build src/index.ts -o dist",
  "prepare": "npm run build"
}
```
Explanation:
* npm run compile → runs the TypeScript compiler via npx tsc, using tsconfig.json.

* npm run build → bundles the result into a single file for GitHub Actions using ncc.

* prepare → Git automatically runs this script when you npm install or npm pack, ensuring the action is always built.

* npm run test → Run unit tests

