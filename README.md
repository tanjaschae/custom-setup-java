npm init -y

npm install --save-dev typescript

npm install @actions/core

npm install --save-dev @types/node

npx tsc --init --rootDir src --outDir dist --target ES2020 --module commonjs --strict

npx tsc 

npm install --save-dev @vercel/ncc