/**
 *
 * @description 执行第三方脚本
 *
 */

const {exec, execAsync, sleep, readFileJSON} = require('./lib/common');
const {cwd} = readFileJSON('../.env.local.json', __dirname, {}).OTHERS_CONFIG || {};
const run = name => () => exec(`node main ${name}`, {cwd});

if (cwd) {
  // TODO 从邮件重写token至指定目录
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
      // 'jd_task_wanyiwan', // TODO 需要修正出错
    ].map(name => [[0], run(name)]),
    [[7, 12, 18, 20, 22], run('jd_task_farmNew')],
    [[23, 10, 22], run('jd_task_inviteFission'), 32],
  ], {name: require('path').basename(__filename), sendLocalMail: true});
}


