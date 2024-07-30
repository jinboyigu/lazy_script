/**
 * @description github action 执行可能出错的脚本， 需本地再执行一遍
 */

const {sleepTime, sleepDate} = require('./lib/cron');
const {exec, sleep} = require('./lib/common');
const {getMoment} = require('./lib/moment');
const schedule = require('node-schedule');

// 积分加油站
schedule.scheduleJob('20 0,7,18 * * *', () => {
  exec('node src/jd/dwapp/PointsGasStation.js start');
});
// 种豆得豆
schedule.scheduleJob('8 15,21 * * *', () => {
  exec('node src/jd/plantBean/index.js start');
});
// 翻一翻
schedule.scheduleJob('10 0,8,9,12,14,15,16,17,19,20,21,22 * * *', () => {
  exec('node src/jd/turnHappy/index.js start');
});
// 转赚红包
schedule.scheduleJob('15 23,1 * * *', () => {
  exec('node src/jd/fission/index.js start');
});
// 玩一玩
schedule.scheduleJob('5 14,23 * * *', () => {
  exec('node src/jd/turnHappy/WanYiWan.js start');
});
// 更新github
schedule.scheduleJob('0 * * * *', () => {
  exec('git pull --rebase');
});


