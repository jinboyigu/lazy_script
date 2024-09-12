const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Fruit1Share extends Template {
  static scriptName = 'Fruit1Share';
  static scriptNameDesc = '东东农场(新)-wx助力';
  static dirname = __dirname;
  static shareCodeTaskList = [
    'ycXdOf_k-w7OCRBTc8CtQiYT5DyYnQ',
    'ycXdOa2yrl-UDRM9GMrtRA',
    'ycXdObm1l3ieXEkWIqjxcAzm3sG1MT8',
    'ycXdOaS1kn2xcGQDKa_0X1nw7Ccqm1No',
    'ycXdOaS1kgqcCB8EeZygeZENbtC109cBtg',
  ];
  static commonParamFn = () => ({
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'apple',
    clientVersion: '9.21.60',
    appid: 'hot_channel',
    loginType: 11,
  });
  static keepIndependence = true;
  static needInApp = false;
  static cookieKeys = ['wq_uin', 'wq_skey'];

  static apiOptions() {
    return {
      options: {
        qs: {
          g_ty: 'ls',
          g_tk: '1069559957',
        },
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/762/page-frame.html',
          wqreferer: 'http://wq.jd.com/wxapp/pages/marketing/dd_farm/landing_page/index_1',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003137) NetType/WIFI Language/zh_CN',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {},
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    self.initShareCodeTaskList(shareCodes || []);
    await self.beforeRequest(api);

    for (const inviteCode of self.getShareCodeFn()) {
      const {subCode, message} = await api.doFormBody('miniTask_ddFarmJump', {
        'taskId': '6297',
        inviteCode,
        'taskType': 'WECHAT_SHARE',
      }) || {};
      api.log(`助力结果: ${message}`);
      if ([0/* 成功 */, 2005/* 没次数 */].includes(subCode)) {
        break;
      }
    }
  }
}

singleRun(Fruit1Share).then();

module.exports = Fruit1Share;
