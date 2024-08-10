const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class MorningHbReward extends Template {
  static scriptName = 'MorningHbReward';
  static scriptNameDesc = '小程序-早起红包';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'apple',
    clientVersion: '9.19.240',
    appid: 'hot_channel',
    loginType: 11,
    body: {},
  });
  static times = 1;
  static keepIndependence = true;
  static cookieKeys = ['wq_uin', 'wq_skey'];
  static needInApp = false;

  static isSuccess(data) {
    return data['subCode'] === 0;
  }

  static apiOptions() {
    return {
      options: {
        uri: 'https://api.m.jd.com/',
        qs: {
          g_ty: 'ls',
          g_tk: '1878487459',
        },
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/757/page-frame.html',
          wqreferer: 'http://wq.jd.com/wxapp/pages/marketing/entry_task/sliver',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003137) NetType/WIFI Language/zh_CN',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      replaceMethods: ['doPathBody'],
      config: {
        morningHbReward: {appId: '4cc68'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const doPathBody = functionId => api.doPathBody(`silverHair_${functionId}`, void 0, {functionId: `silverHair_${functionId}`});
    await doPathBody('morningHbReward').then(data => {
      if (self.isSuccess(data)) {
        api.log(`获取红包 ${_.get(data, 'data.discount')}`);
      } else {
        api.log(data.message);
      }
    });
  }
}

singleRun(MorningHbReward).then();

module.exports = MorningHbReward;
