/**
 * @description github action 执行可能出错的脚本， 需本地再执行一遍
 */

const {sleepTime, sleepDate} = require('./lib/cron');
const {exec, execAsync, sleep} = require('./lib/common');
const {getMoment} = require('./lib/moment');
const schedule = require('node-schedule');

(function main() {
  const nodeCommand = (file, method = 'start', cookieIndex = '*', command1) => `node ${file} ${method} ${cookieIndex} ${command1}`;
  const execNode = (...args) => exec(nodeCommand(...args));
  // 0 分活动
  schedule.scheduleJob('0 0 * * *', () => {
    // execAsync([
    //   nodeCommand('src/jd/applet/mini.js'),
    // ]);
    // execNode('src/jd/local/EarnJoinGroup/index.js');
  });
  // 积分加油站
  schedule.scheduleJob('20 0,7,18 * * *', () => {
    execNode('src/jd/dwapp/PointsGasStation.js');
  });
  // 种豆得豆
  schedule.scheduleJob('8 15,21 * * *', () => {
    execNode('src/jd/plantBean/index.js');
  });
  // 翻一翻
  schedule.scheduleJob('10 0,8,9,12,14,15,16,17,19,20,21,22 * * *', () => {
    execNode('src/jd/turnHappy/index.js');
  });
  // 转赚红包
  schedule.scheduleJob('32 23,10,22 * * *', () => {
    execNode('src/jd/fission/index.js');
  });
  // 玩一玩
  schedule.scheduleJob('5 7,12,14,20,23 * * *', () => {
    execNode('src/jd/turnHappy/WanYiWan.js');
  });
  // 宠汪汪
  schedule.scheduleJob('10 0,4,8,12,20,22 * * *', () => {
    execNode('src/jd/joy/index.js');
  });
  // 宠汪汪
  schedule.scheduleJob('54 23,7,15 * * *', () => {
    execNode('src/jd/joy/redeem.js', 'start');
  });
  schedule.scheduleJob('15 * * * *', () => {
    execNode('src/jd/turnHappy/WanYiWan.js', 'start', '*', '3');
  });
  // 更新github
  schedule.scheduleJob('0 * * * *', () => {
    exec('git pull --rebase');
  });
})();
