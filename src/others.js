/**
 *
 * @description 执行第三方脚本
 *
 */

const _ = require('lodash');
const fs = require('fs');
const {exec, execAsync, sleep, readFileJSON} = require('./lib/common');
const {updateEnvFromMail} = require('./lib/mailer');
const Cookie = require('./lib/cookie');
const {updateProcessEnv, getProductEnv} = require('./lib/env');
const path = require('path');
const vm = require('vm');
const {cwd} = readFileJSON('../.env.local.json', __dirname, {}).OTHERS_CONFIG || {};
const run = name => () => exec(`node main ${name}`, {cwd});

// 从邮件中更新
async function updateOthersCookie() {
  updateProcessEnv();
  const notUpdated = await updateEnvFromMail();

  if (notUpdated) return;
  const otherCookie = (() => {
    const _ctx = {};
    vm.createContext(_ctx);
    vm.runInContext(fs.readFileSync(path.resolve(cwd, 'cookie/jd.js')).toString().replace('export default ', 'var data = '), _ctx);
    return _ctx.data;
  })();
  getProductEnv().JD_COOKIE_OPTION.forEach(({cookies}, index) => {
    if (cookies.wskey) return;
    if (!cookies.pt_key) {
      otherCookie.main[index] = '';
      return;
    }
    const cookie = new Cookie(_.pick(cookies, ['pt_pin', 'pt_key']));
    otherCookie.main[index] = cookie.toString();
  });
  otherCookie.main = _.filter(otherCookie.main);
  fs.writeFileSync(path.resolve(cwd, 'cookie/jd.js'), `export default ${JSON.stringify(otherCookie, null, 4)}`);
  console.log(`更新 ${cwd} cookies 成功`);
  // TODO 更新 git
  // exec('git pull --rebase');
}

(async () => {
  if (!cwd) return;


  await updateOthersCookie();
  // TODO 调整log输出
  require('./appBase')([
    [[6, 12, 22], run('jd_task_checkCookie')],
    // hour0
    ...[
      // 'jd_task_union',
      'jd_task_dwapp',
      'jd_task_daka',
      'jd_task_chuxu',
      'jd_task_beanHome',
      'jd_task_luban',
      'jd_task_xiaoge',
      'jd_task_deliverySign',
      'jd_task_plusBusiness',
      // 'jd_task_wanyiwan', // TODO 需要修正出错
    ].map(name => [[0], run(name)]),
    [[7, 12, 18, 20, 22], run('jd_task_farmNew')],
    [[23, 10, 22], run('jd_task_inviteFission'), 32],
  ], {name: require('path').basename(__filename), sendLocalMail: true});
})();
