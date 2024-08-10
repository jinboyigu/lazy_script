/**
 * @description github action 执行可能出错的脚本， 需本地再执行一遍
 */

const {sleepTime, sleepDate} = require('./lib/cron');
const {exec, execAsync, sleep} = require('./lib/common');
const {getMoment} = require('./lib/moment');
const schedule = require('node-schedule');

(function main() {
  const nodeCommand = (file, method = 'start') => `node ${file} ${method}`;
  const execNode = (file, method) => exec(nodeCommand(file, method));
  // 0 分活动
  schedule.scheduleJob('0 0 * * *', () => {
    execAsync([
      nodeCommand('src/jd/applet/mini.js'),
    ]);
    execNode('src/jd/local/EarnJoinGroup/index.js');
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
  schedule.scheduleJob('39 10,20,22 * * *', () => {
    execNode('src/jd/fission/index.js');
  });
  // 玩一玩
  schedule.scheduleJob('5 7,12,14,20,23 * * *', () => {
    execNode('src/jd/turnHappy/WanYiWan.js');
  });
  // 小程序-早起红包
  schedule.scheduleJob('55 5 * * *', () => {
    execNode('src/jd/applet/morningHbReward.js');
  });
  // 更新github
  schedule.scheduleJob('0 * * * *', () => {
    exec('git pull --rebase');
  });
})();
