const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');
const {sleepTime} = require('../../lib/cron');
const {getEnv} = require('../../lib/env');

class AppletMini extends Template {
  static scriptName = 'AppletMini';
  static scriptNameDesc = '小程序-超级省';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static defaultShareCodes = [
    'Sv_h1QhgY81XeKR6b1A',
    'S7a4gE0Ic8A',
    'S-akZNEhNqhCPQUKp84M',
    'S5KkcMWdhhwWERkeG8q5f',
    'S5KkcRkoZ_ALUdROgkqIJdw',
  ];
  static commonParamFn = () => ({
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'apple',
    clientVersion: '9.21.200',
    appid: 'hot_channel',
    loginWQBiz: 'signcomponent',
    loginType: 11,
  });
  static keepIndependence = true;
  static cookieKeys = ['wq_uin', 'wq_skey'];
  static needInApp = false;
  static concurrent = true;

  static isSuccess(data) {
    return data['subCode'] === 0;
  }

  static apiOptions() {
    return {
      options: {
        uri: 'https://api.m.jd.com/',
        qs: {
          g_ty: 'ls',
          g_tk: '1874212660',
        },
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/756/page-frame.html',
          wqreferer: 'http://wq.jd.com/wxapp/pages/marketing/entry_task/index',
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
        miniTask_hbChannelPage: {appId: '60d61'},
        mini_doSign: {appId: '60d61'},
        MiniTask_ScanTask: {appId: '60d61'},
        MiniTask_ScanReward: {appId: '60d61'},
        MiniTask_ChannelPage: {appId: '60d61'},
        miniTask_superSaveGetRights: {appId: '87bb2'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const doPathBody = (functionId, body) => api.doPathBody(functionId, body, {functionId});

    const shareIndex = _.first(self._command) || getEnv('JD_HB_COOKIE_INDEX', 0, 0);
    const waitToDoShare = self.getNowHour() === 23;
    const {currentCookieIndex} = api;
    const isShareIndex = currentCookieIndex === shareIndex;

    if (waitToDoShare) {
      await sleepTime(24);
    }

    if (self.isFirstLoop() && isShareIndex) {
      await sleep(10);
    }
    const {signInfo, scanTaskList, assistTask, hasLogin, stop} = await doPathBody('miniTask_hbChannelPage', {
      'source': 'task',
      'businessSource': 'cjs',
    }).then(data => {
      if (self.isSuccess(data)) {
        return data.data;
      } else {
        api.log(data.message);
        return {stop: true};
      }
    });
    if (stop) return;
    if (!hasLogin) {
      throw api.logBoth('未登录');
    }
    if (!signInfo) {
      api.logBoth('miniTask_hbChannelPage 异常');
      return;
    }
    const {signTaskList} = signInfo || {};
    const signTask = signTaskList.find(o => o.currentDay && !o.signStatus);

    if (assistTask.completionCnt) {
      for (const {order, status, userTag} of assistTask.assistList) {
        if (userTag && !status) {
          await doPathBody('miniTask_doAssistReward', {order, itemId: assistTask.itemId}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`获得红包 ${data.data.discount}`);
            } else {
              api.log(`获取失败: ${data.message}`);
            }
          });
        }
      }
    }

    if (waitToDoShare) {
      await handleDoSign();
      await handleDoShare();
    } else {
      await handleSignGetCoupons();
      await handleDoTask();
    }

    async function handleDoShare() {
      self.updateShareCodeFn(assistTask.itemId);
      await _do(isShareIndex ? self.defaultShareCodes[shareIndex === 0 ? 1 : 0] : self.defaultShareCodes[shareIndex]);

      async function _do(itemId, times = 3) {
        if (!itemId || times === 0) return;
        return doPathBody('miniTask_doAssist', {itemId}).then(async data => {
          if (self.isSuccess(data)) {
            api.log(`助力成功 ${itemId}`);
          } else {
            api.log(`助力失败: ${data.message}`);
            if (data.message.match('火爆')) {
              // 稍后再助力
              await sleep(2);
              return _do(itemId, --times);
            }
          }
        });
      }
    }

    async function handleDoSign() {
      signTask && await doPathBody('mini_doSign', {itemId: signTask.itemId}).then(data => {
        if (self.isSuccess(data)) {
          api.log(`签到成功: ${data.data.toastMsg}`);
        } else {
          api.log(`签到失败: ${data.message}`);
        }
      });
    }

    async function handleDoTask() {
      for (let {scanAssignmentId, itemId, type, times, status, subTitle} of scanTaskList) {
        if (!scanAssignmentId || status >= 2) continue;
        if (status === 0) {
          const doTask = (actionType = 1) => doPathBody('MiniTask_ScanTask', {
            actionType,
            scanAssignmentId,
            itemId,
            type,
          });
          await doTask();
          await sleep(times);
          await doTask(0);
          status++;
        }
        if (status === 1) {
          await sleep(2);
          await doPathBody('MiniTask_ScanReward', {scanAssignmentId, type}).then(data => {
            if (self.isSuccess(data)) {
              api.log(`完成${subTitle}, 获得${data.data.map(o => `${o.discount}金币(type=${o.type})`).join(', ')}`);
            } else {
              api.log(data.message);
            }
          });
          await sleep(2);
        }
      }
    }

    // 每天领神券
    async function handleSignGetCoupons() {
      if (!self.isFirstLoop()) return;
      await doPathBody('MiniTask_ChannelPage', {
        'source': 'task',
        'silverHairInfo': {'oldVersion': '0', 'crowdIdentificationSigns': '0', 'openType': '0'},
        'expose': false,
        'xyhfAuth': 2,
        'businessSource': 'qiwei',
        'versionFlag': 'new',
      }).then(async data => {
        const floors = _.get(data, 'data.newChannelPage.floors', []);
        const target = floors.find(o => o.floorTitle === '每天领神券' && o.signList);
        if (!target) return;
        for (const {currentDay, rewardStatus} of target.signList) {
          if (!currentDay || rewardStatus) continue;
          await doPathBody('miniTask_superSaveGetRights', {itemId: '1'}).then(data => {
            if (self.isSuccess(data)) {
              const rewards = _.get(data, 'data.rights', []).map(o => `${o.category}(${o.quota}-${o.discount})`).join(', ');
              api.log(`[${target.floorTitle}] 签到成功, 获得 ${rewards}`);
            } else {
              api.log(`[${target.floorTitle}] 签到失败, ${JSON.stringify(data)}`);
            }
          });
        }
      });
    }
  }
}

singleRun(AppletMini).then();

module.exports = AppletMini;
