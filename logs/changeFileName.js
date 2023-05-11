const fs = require('fs');

const result = fs.readdirSync('./').toString();
const {exec} = require('../src/lib/common');

result.split(',').forEach(fileName => {
  if (fileName.match(/^\w+\.log\./)) {
    const [, name, date] = fileName.match(/(\w*)\.log.(\d+-\d+-\d+)/) || [];
    if (name && date) {
      exec(`mv ${fileName} ${name}.${date}.log`);
    }
  }
});
