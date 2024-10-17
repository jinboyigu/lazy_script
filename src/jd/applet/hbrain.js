const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class AppletHBRain extends Template {
  static scriptName = 'AppletHBRain';
  static scriptNameDesc = '小程序-红包雨';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'apple',
    clientVersion: '9.22.110',
    appid: 'hot_channel',
    loginType: 11,
  });
  static times = 1;
  static keepIndependence = true;
  static cookieKeys = ['wq_uin', 'wq_skey'];
  static needInApp = false;
  static activityEndTime = '2024-11-11';

  static isSuccess(data) {
    return data['subCode'] === 0;
  }

  static apiOptions() {
    return {
      options: {
        uri: 'https://api.m.jd.com/',
        qs: {
          g_ty: 'ls',
          g_tk: '1423555137',
        },
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/767/page-frame.html',
          wqreferer: 'http://wq.jd.com/wxapp/pages/index/index',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.52(0x18003426) NetType/4G Language/zh_CN',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      replaceMethods: ['doPathBody'],
      config: {
        wxsport_hbrain_draw: {appId: 'd983f'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await api.doPathBody('wxsport_hbrain_draw', {}, {functionId: 'wxsport_hbrain_draw'}).then(data => {
      if (data.subCode === 0) {
        api.log(`获得红包 ${_.get(data, 'data.prizeInfo.hbPrize.discount')}`);
      } else {
        api.log(data.message);
      }
    });
  }
}

singleRun(AppletHBRain).then();

module.exports = AppletHBRain;
