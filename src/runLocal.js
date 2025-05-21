/**
 * @description github action 执行可能出错的脚本， 需本地再执行一遍
 */

const {exec, execAsync, sleep} = require('./lib/common');
const schedule = require('node-schedule');

(function main() {
  const nodeCommand = (file, method = 'start', cookieIndex = '*', command1) => `node ${file} ${method} ${cookieIndex} ${command1}`;
  const execNode = (...args) => exec(nodeCommand(...args));
  schedule.scheduleJob('20 * * * *', () => {
    exec('node src/lib/others/kedaya/util/download.js');
    execAsync(['node src/local.js', 'node src/others.js']);
    // 更新github
    exec('git pull --rebase');
  });
})();
