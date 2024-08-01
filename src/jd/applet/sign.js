const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class AppletSign extends Template {
  static scriptName = 'AppletSign';
  static scriptNameDesc = '小程序-签到';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'apple',
    clientVersion: '9.19.240',
    appid: 'hot_channel',
    loginWQBiz: 'signcomponent',
    loginType: 11,
    body: {'activityId': '10004', 'version': 1},
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
        uri: 'https://api.m.jd.com/signTask/',
        qs: {
          g_ty: 'ls',
          g_tk: '1874212660',
        },
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/755/page-frame.html',
          wqreferer: 'http://wq.jd.com/wxapp/pages/marketing/glb/glb/index',
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
        doSignTask: {appId: '9a38a'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const doPathBody = functionId => api.doPathBody(functionId, void 0, {functionId: `SignComponent_${functionId}`});
    const completionFlag = await doPathBody('querySignList').then(_.property('data.completionFlag'));
    if (!completionFlag) {
      await doPathBody('doSignTask').then(data => {
        if (self.isSuccess(data)) {
          api.log(`签到获取小程序红包 ${_.get(data, 'data.rewardList[0].discount')}`);
        } else {
          api.log(data.message);
        }
      });
    } else {
      api.log('今天已签到');
    }
  }
}

singleRun(AppletSign).then();

module.exports = AppletSign;
