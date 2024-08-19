/**
 * @description 用来执行脚本(忽略警告)
 */

const _ = require('lodash');
const {exec} = require('./src/lib/common');
let [nodePath, selfPath, filePath, command1/*method*/, command2/*cookie index*/, ...command3/*other params*/] = process.argv;

function run() {
  filePath = filePath.replace(/\\/g, '/');
  let method = command1;
  const others = [command2, ...command3];
  if (['start', 'cron', 'loop'].includes(command1)) {
    method = command1;
  } else {
    if (filePath.match('src/jd')) {
      method = 'start';
    }
    if (method !== command1) {
      others.unshift(command1);
    }
  }

  const command = `node ${filePath} ${_.filter([method, ...others]).join(' ')}`;
  console.log(`real > ${command}`);
  exec(command);
}

run();
