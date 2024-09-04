const _ = require('lodash');
const {getNowDate, getNowHour, getMoment} = require('./lib/moment');
const {updateProcessEnv, processInAC, getEnv} = require('./lib/env');
const {sleep} = require('./lib/common');
require('../src/lib/common').exec('node src/shell/updateEnvFromMail.js');
updateProcessEnv();
const {
  sendNotify,
  run,
} = require('./api');

const nowDate = getNowDate();
const nowHour = getNowHour();

const _send = processInAC() ? sendNotify.bind(0, {
  sendYesterdayLog: nowHour === 23,
  subjects: [void 0, nowDate, nowHour],
}) : _.noop;
// 超时需自动退出

module.exports = async (data = [], {sendLocalMail = false, name}) => {
  const output = msg => console.log(`${getMoment().format()} [${name}] ${msg}`);
  if (process.env.NOT_RUN) {
    return output('不执行脚本');
  }

  !getEnv('DISABLE_AUTO_EXIT') && (async function autoExit() {
    await sleep(60 * 60);
    await _send();
    output('超时需自动退出');
    process.exit();
  })().then();

  if (sendLocalMail) {
    data.push([[23], sendNotify.bind(0, {subjects: ['lazy_script_local', getNowDate()]}), 40]);
  }
  output('开始执行');
  await run(data, output);
  output('结束执行');
  await _send();
};
