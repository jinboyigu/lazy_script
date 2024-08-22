const _ = require('lodash');
const {getNowDate, getNowHour, getMoment} = require('./lib/moment');
const {getCookieData, updateProcessEnv, processInAC, getEnv} = require('./lib/env');
const {sleepTime} = require('./lib/cron');
const {sleep, parallel} = require('./lib/common');
require('../src/lib/common').exec('node src/shell/updateEnvFromMail.js');
updateProcessEnv();
const {
  multipleRun,
  serialRun,
  doRun,
  doRun1,
  doCron,
  doCron1,
  TemporarilyOffline,
  sendNotify,
} = require('./api');

const Fruit = require('./jd/fruit');
let Joy = require('./jd/joy');

const nowDate = getNowDate();
const nowHour = getNowHour();

const _send = _.noop || sendNotify.bind(0, {
  sendYesterdayLog: nowHour === 23,
  subjects: [void 0, nowDate, nowHour],
});
// 超时需自动退出
const autoExit = async () => {
  await sleep(60 * 60);
  _send();
  process.exit();
};

if (processInAC()) {
  Joy = TemporarilyOffline;
}

!getEnv('DISABLE_AUTO_EXIT') && autoExit();
main().then(_send);

async function main() {
  if (process.env.NOT_RUN) {
    console.log('不执行脚本');
    return;
  }

  const serialRunConfig = [
    [[0, 4, 8, 9, 12, 20, 22], Joy],
    [[1, 7, 18], require('./jd/dwapp/PointsGasStation')],
    [[7, 15, 21], require('./jd/plantBean')],
    [[7, 14, 20, 22, 23], require('./jd/turnHappy/WanYiWan')],
    // 定时任务
    [[19], require('./jd/superRedBagDraw'), 25],
    [[23, 10, 22], require('./jd/fission'), 32],
    [[23, 7, 15], require('./jd/joy/redeem'), 54],
    [[23], require('./jd/turnHappy/WanYiWan'), 60],
  ];
  const serialRunTargets = [];
  const specialTargets = [];
  const promises = [];
  for (const [hours, target, minute] of serialRunConfig) {
    if (hours.includes(nowHour)) {
      if (minute) {
        specialTargets.push([minute, target]);
      } else {
        serialRunTargets.push(target);
      }
    }
  }
  promises.push(() => serialRun(serialRunTargets));
  for (const [minute, target] of specialTargets) {
    promises.push(async () => {
      await sleepTime([nowHour, minute]);
      await multipleRun(target);
    });
  }
  await parallel(promises);
}
