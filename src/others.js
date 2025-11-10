/**
 *
 * @description 执行第三方脚本
 *
 */

const _ = require('lodash');
const fs = require('fs');
const {exec, execAsync, sleep, readFileJSON, writeFileJSON} = require('./lib/common');
const {updateEnvFromMail} = require('./lib/mailer');
const Cookie = require('./lib/cookie');
const {updateProcessEnv, getProductEnv} = require('./lib/env');
const path = require('path');
const vm = require('vm');
const {getNowDate, getNowHour} = require('./lib/moment');
const localEnv = readFileJSON('../.env.local.json', __dirname, {});
let {cwd, needRunCommonTask} = localEnv.OTHERS_CONFIG || {};
const commonTaskHour = 0;
let runCommonTask = getNowHour() === commonTaskHour;
const updateLocalEnv = (needRunCommonTask) => {
  localEnv.OTHERS_CONFIG.needRunCommonTask = needRunCommonTask;
  writeFileJSON(localEnv, '../.env.local.json', __dirname);
};
if (cwd.startsWith('.')) {
  cwd = path.resolve(__dirname, `../${cwd}`);
}
const logFileName = `others`;

const run = name => () => exec(`node main ${name} | tee -a ${path.resolve(__dirname, `../logs/${logFileName}.${getNowDate()}.log`)}`, {cwd});

async function beforeRun() {
  // 其他仓库更新
  // exec(`node patch.js`, {cwd});

  updateProcessEnv();
  const notUpdated = await updateEnvFromMail();

  // 每次都需要更新
  // if (notUpdated) return console.log('无需更新 cookies');
  // 从邮件中同步其他仓库的cookie
  const jdCookies = getProductEnv().JD_COOKIE_OPTION;
  runCommonTask && jdCookies.some(o => !o.cookies.pt_key) && updateLocalEnv(true);
  needRunCommonTask && jdCookies.every(o => o.cookies.pt_key) && (runCommonTask = true) && updateLocalEnv(false);
  updateConfigJS('cookie/jd.js', data => {
    const cookieMain = [];
    jdCookies.forEach(({cookies}, index) => {
      const cookie = new Cookie(cookies);
      const oldCookie = data.main.find(str => new Cookie(str).get('pt_pin') === cookie.get('pt_pin'));
      /*if (cookies.wskey) {
        if (oldCookie) {
          cookieMain[index] = oldCookie;
        } else {
          cookieMain[index] = cookie.toString('pt_pin');
        }
      } else */
      if (cookies.pt_key) {
        cookieMain[index] = cookie.toString(['pt_pin', 'pt_key']);
      } else {
        cookieMain[index] = '';
      }
    });
    data.main = _.filter(cookieMain);
    return data;
  });
  updateConfigJS('config/jdUser.js', () => {
    let result = {};
    jdCookies.forEach(({cookies}, index) => {
      result[cookies.pt_pin] = _.pick(cookies, ['wskey']);
    });
    return result;
  });

  function updateConfigJS(name, update) {
    const filePath = path.resolve(cwd, name);
    const data = (() => {
      const _ctx = {};
      vm.createContext(_ctx);
      vm.runInContext(fs.readFileSync(filePath).toString().replace('export default ', 'var data = '), _ctx);
      return _ctx.data;
    })();

    const result = update(data);
    fs.writeFileSync(filePath, `export default ${JSON.stringify(result, null, 4)}`);
    console.log(`${filePath} 更新成功`);
  }
}

(async () => {
  if (!cwd) return;


  await beforeRun();

  if (getNowHour() === -1) return;

  const getCommonTask = (hour = commonTaskHour) => [
    // 'jd_task_quanyi',
    'jd_task_union_local',
    'jd_task_dwapp',
    // 'jd_task_daka',
    // 'jd_task_chuxu',
    'jd_task_beanHome',
    // 'jd_task_luban',
    // 'jd_task_xiaoge',
    // 'jd_task_deliverySign',
    // 'jd_task_plusBusiness',
    // 'jd_task_pushRedpacket',
    // 'jd_task_hudong',
    // 'jd_task_wanyiwan',
    // 'jd_task_wxFarm',
    // 'jd_task_receive',
    // 'jd_task_vote',
    // 'jd_task_jinrong',
  ].map(name => [[hour], run(name)]);
  // TODO 调整log输出
  require('./appBase')([
    // [[8, 20], run('jd_task_checkCookie')],
    // hour0
    ...getCommonTask(runCommonTask ? getNowHour() : commonTaskHour),
    // [[7, 12, 18, 20, 22], run('jd_task_farmNew')],
    // [[20], run('jd_task_hbRain')],
    // [[23, 10, 22], run('jd_task_inviteFission'), 32],
    // [[19], run('jd_task_yaoyiyao')],
    [[22], run('jd_task_assets')],
    // [[17, 20, 22], run('jd_task_smAnswer')],
  ], {name: require('path').basename(__filename), sendLocalMail: logFileName});
})();
