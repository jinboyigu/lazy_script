const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const {processInAC} = require('../../lib/env');
const _ = require('lodash');

class CashApplet extends Template {
  static scriptName = 'CashApplet';
  static scriptNameDesc = '领现金-小程序';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'version': '1', 'channel': 'applet'},
    appid: 'signed_mp',
    clientVersion: '1.0.0',
    client: 'wh5',
    clientType: 'wxapp',
    loginType: '1',
    loginWQBiz: 'pet-town',
  });
  static activityEndTime = '2023-07-28';
  static times = 1;
  static cookieKeys = ['wq_uin', 'wq_skey'];

  static apiOptions = {
    options: {
      headers: {
        referer: 'https://servicewechat.com/wx91d27dbf599dff74/712/page-frame.html',
        wqreferer: 'http://wq.jd.com/wxapp/pages/ac/get_cash/pages/index/index',
      },
      qs: {
        g_ty: 'ls',
        g_tk: 1793995565,
      },
      repeatFn: data => data.code === '404',
    },
  };

  static async beforeRequest(api) {
    const self = this;
    const needStop = !await this.updateWqAuthToken(api);
    if (needStop) api.logSignOut(!processInAC());
    self.injectEncryptH5st(api, {
      config: {
        cash_task_info: {appId: 'c8815'},
        cash_mob_home: {appId: 'c8815'},
        cash_doTask: {appId: 'c8815'},
        cash_qr_code_assist: {appId: 'c8815'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();
    await handleDoShare();

    async function handleDoTask() {
      let doneTask = false;
      const taskList = await api.doFormBody('cash_task_info', {'remind': 0}).then(_.property('data.result')) || [];
      for (const {duration, type} of taskList) {
        doneTask = true;
        await sleep(duration);
        await api.doFormBody('cash_doTask', {type, 'source': 2});
      }
      if (doneTask) {
        return handleDoTask();
      }
    }

    async function handleDoShare() {
      const {
        inviteCode,
        shareDate,
        signMoney,
        roundIntro,
      } = await api.doFormBody('cash_mob_home').then(_.property('data.result'));
      api.log(`当前钱数: ${signMoney}`);

      if (api.isFirst) {
        if (roundIntro.includes('邀请助力功能升级中')) {
          api.log('邀请助力功能升级中');
          return;
        }
        self.shareCode = {inviteCode, shareDate};
      } else if (self.shareCode) {
        await api.doFormBody('cash_qr_code_assist', {...self.shareCode, type: 2}).then(data => {
          if (self.isSuccess(data)) {
            api.log(`成功助力 ${data.data.result.hostPin}`);
          } else {
            api.log(data.data.bizMsg);
          }
        });
      }
    }
  }
}

singleRun(CashApplet).then();

module.exports = CashApplet;
