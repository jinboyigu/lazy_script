const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const _ = require('lodash');

class Cash extends Template {
  static scriptName = 'Cash';
  static scriptNameDesc = '领现金';
  static shareCodeTaskList = [];
  static dirname = __dirname;
  static needOriginH5 = true;
  static needInAppComplete1 = true;
  static times = 1;
  static commonParamFn = () => ({
    body: {'version': '1', 'channel': 'app'},
    appid: 'signed_wh5',
    clientVersion: '12.0.4',
    client: 'apple',
  });
  static activityEndTime = '2023-08-31';

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        cash_mob_home: {appId: '5473d'},
        cash_mob_sign: {appId: '5473d'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();
    const signMoney = await handleDoSign();
    api.log(`总数为: ${signMoney}`);

    async function handleDoTask() {
      let doneTask = false;
      const taskList = await api.doFormBody('cash_task_info', {'remind': 0}).then(_.property('data.result')) || [];
      if (!_.isEmpty(taskList)) {
        // TODO
        return api.log('有任务了, 需要先手动执行');
      }
      for (const {duration, type} of taskList) {
        doneTask = true;
        await sleep(duration);
        await api.doFormBody('cash_doTask', {type, 'source': 2});
      }
      if (doneTask) {
        return handleDoTask();
      }
    }

    async function handleDoSign() {
      const {signedStatus, signMoney} = await api.doFormBody('cash_mob_home').then(_.property('data.result'));
      if (signedStatus !== 2) {
        api.log('今日已签到');
        return signMoney;
      }
      const signCash = await api.doFormBody('cash_mob_sign', {remind: 0}).then(data => {
        const signCash = _.get(data, 'data.result.signCash', 0);
        if (self.isSuccess(data)) {
          api.log(`签到成功, 获取到 ${signCash}`);
        } else {
          api.log(`签到失败`);
        }
        return signCash;
      });
      return +signMoney + signCash;
    }
  }
}

singleRun(Cash).then();

module.exports = Cash;
