const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

const config = [
  ['7221851452157726720', 'http://3.cn/23xR50-q'],
  ['7232231843406286848', 'http://3.cn/24-3EZkY'],
  ['7229441891987623936', 'http://3.cn/23D-Lt3H'],
  ['7221851013660020736', 'http://t.cn/A6R4lpkV'],
  ['7241982806455226368', '小程序'],
];

class ChatReward extends Template {
  static scriptName = 'ChatReward';
  static scriptNameDesc = '社群红包';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'wechat_activity',
    client: 'h5',
    loginType: 2,
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://wechat-social-group-pro.pf.jd.com',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323d) NetType/WIFI Language/zh_CN',
          referer: 'https://wechat-social-group-pro.pf.jd.com/',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        chatReward_mainPage: {appId: '323f1'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    for (const item of config) {
      const [activityId, url, stop] = item;
      if (stop) {
        continue;
      }
      const {data: {userRewardStatus, userTypeCheck}, message, subCode} = await mainPage(activityId);
      if ([1001/*活动未开始*/, 1002/*活动已结束*/].includes(subCode)) {
        item[2] = message;
      }
      if (message) {
        api.log(`[${activityId}] ${message}(${url})`);
        continue;
      }
      if (userTypeCheck && userRewardStatus === 0) {
        await api.doGetBody('chatReward_doReward', {activityId});
        await mainPage(activityId);
      }
    }

    async function mainPage(activityId) {
      const data = await api.doGetBody('chatReward_mainPage', {activityId});
      const {data: {rewardInfo}} = data;
      if (rewardInfo && !_.isEmpty(rewardInfo)) {
        api.logBoth(`已领取: ${rewardInfo.rewardValue}(${rewardInfo.expireTime})`);
      }
      return data;
    }
  }
}

singleRun(ChatReward).then();

module.exports = ChatReward;
