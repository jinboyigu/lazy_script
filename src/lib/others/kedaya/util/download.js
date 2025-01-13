const fs = require('fs');
const path = require('path');
const request = require('request');

async function main() {
  const config = [
    ['jdAlgo.js', 'https://raw.githubusercontent.com/qitoqito/kedaya/refs/heads/main/util/jdAlgo.js'],
  ];
  for (const [name, url] of config) {
    const stream = fs.createWriteStream(path.resolve(__dirname, name));
    await request(url).pipe(stream).on('close', function (err) {
      console.log(`${name}] download success`);
    });
  }
}

main();


