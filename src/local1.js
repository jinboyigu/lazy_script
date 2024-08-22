/**
 * @description github action 执行可能出错的脚本， 需本地再执行一遍
 */

const {sleepTime, sleepDate} = require('./lib/cron');
const {exec, execAsync, sleep} = require('./lib/common');
const {getMoment, getNowDate} = require('./lib/moment');
const schedule = require('node-schedule');
const {sendNotify} = require('./api');
const {updateProcessEnv} = require('./lib/env');

const sendMail = () => sendNotify({subjects: ['lazy_script_local', getNowDate()]});

(function main() {
  const nodeCommand = (file, method = 'start', cookieIndex = '*', command1) => `node ${file} ${method} ${cookieIndex} ${command1}`;
  const execNode = (...args) => exec(nodeCommand(...args));
  schedule.scheduleJob('0 * * * *', () => {
    exec('node src/local.js');
    // 更新github
    exec('git pull --rebase');
  });
  // 发送邮件
  schedule.scheduleJob('20 23 * * *', async () => {
    updateProcessEnv();
    await sendMail();
  });
})();
