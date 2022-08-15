const _ = require('lodash');
const {getNowDate, getNowHour} = require('./lib/moment');
const {getCookieData, updateProcessEnv, getProductEnv} = require('./lib/env');
const {printLog, sleep} = require('./lib/common');
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

const log = require('./jd/base').log.bind(require('./jd/base'));

const nowDate = getNowDate();
const nowHour = getNowHour();

main().then(sendNotify.bind(0, {
  subjects: ['lazy_script_action_env', nowDate, nowHour],
}));

async function main() {
  log(JSON.stringify(getProductEnv()), void 0, void 0, 'ENV');
  await sleep(10);
}
