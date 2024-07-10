const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Fission extends Template {
  static scriptName = 'Fission';
  static scriptNameDesc = '转赚红包';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static linkId = 'wDNvX5t2N52cWEM8cLOa0g';
  static defaultShareCodes = [
    'CeymEOdTGnhBzMjmwC12IA',
    'i47xTSBS86MoV47MrC276w',
  ];
  static commonParamFn = () => ({
    body: {linkId: this.linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.1',
  });
  static keepIndependence = true;
  static needInApp = false;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html',
          'referer': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html?from=kouling&channelType=1&activityChannel=jdapp&femobile=femobile&tttparams=WIFszeyJnTGF0IjoiMjIuOTQzMTA1IiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQzMTA1IiwicG9zTG5nIjoiMTEzLjQ3NDcxOCIsImdwc19hcmVhIjoiMF8wXzBfMCIsImxuZyI6IjExMy40MjM3MjAiLCJ1ZW1wcyI6IjItMC0yIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn50%3D&originId=3orGfh1YkwNLksxOcN8zWQ&inviteCode=voN1y2F4JuplvN6EKiBjFe4a8n6-2Gg_7sca7-HKNDg&inviterId=CeymEOdTGnhBzMjmwC12IA',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        wheelsHome: {appId: 'c06b7'},
        inviteFissionBeforeHome: {appId: '02f8d'},
        inviteFissionHome: {appId: 'eb67b'},
        inviteFissionDrawPrize: {appId: 'c02c6'},
        apCashWithDraw: {appId: '73bca'},
        inviteFissionhelp: {appId: 'c5389'},
        superRedBagList: {appId: 'f2b1d'},
        apsDoTask: {appId: '54ed7'},
        apTaskDrawAward: {appId: '6f2b6'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    self.initShareCodeTaskList(shareCodes || []);
    await self.beforeRequest(api);

    if (self.isFirstLoop()) {
      process.isProxy && await handleSuperRedBagList();
      await handleDoTask();
    }
    await handleHome();

    async function handleSuperRedBagList() {
      const items = await api.doFormBody('superRedBagList', {
        'pageNum': 1,
        'pageSize': 20,
        'associateLinkId': '',
        'business': 'fission',
        'prizeTypeLists': [7],
      }).then(_.property('data.items'));
      for (const list of Object.values(_.groupBy(items || {}, 'amount'))) {
        if (list.some(o => o.state === 2)) continue;
        const target = list.find(o => o.state === 1);
        if (!target) continue;
        await apCashWithDraw(target);
        await sleep(2);
      }
    }

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList', {channel: 4}).then(_.property('data'));
      for (const {taskTitle, taskType, id: taskId, taskSourceUrl: itemId, taskFinished} of taskList || []) {
        if (/下单/.test(taskTitle) || taskFinished) continue;
        await api.doFormBody('apsDoTask', {
          taskType,
          taskId,
          'channel': 4,
          'checkVersion': true,
          'cityId': '1601',
          'provinceId': '19',
          'countyId': '36953',
          itemId,
        });
        await sleep(6);
        await api.doFormBody('apTaskDrawAward', {
          taskType,
          taskId,
          'channel': 4,
          'checkVersion': true,
          'cityId': '1601',
          'provinceId': '19',
          'countyId': '36953',
        });
      }
    }

    async function handleHome() {
      const {data: {inviter, prizeNum, countDownTime}} = await api.doFormBody('inviteFissionHome');
      await handleDraw();
      const countDownSecond = countDownTime / 1000;
      // 小于 5 分钟内则需等待下一轮
      if (countDownSecond < 5 * 60) {
        const seconds = countDownSecond + 2;
        api.log(`该场次即将结束, 需等待${seconds}秒后再执行`);
        await sleep(seconds);
        // 重新开启下一轮
        return handleHome();
      }
      self.updateShareCodeFn(inviter);
      if (self.isFirstLoop()) {
        if (api.currentCookieIndex !== 0) {
          await handleDoShare();
        }
      } else if (self.isLastLoop()) {
        if (api.currentCookieIndex === 0) {
          await handleDoShare();
        }
      }

      async function handleDraw() {
        for (let i = 0; i < prizeNum; i++) {
          const result = await api.doFormBody('inviteFissionDrawPrize');
          await sleep(5);
          if (!_.get(result, 'success')) continue;
          const {data} = result;
          const {prizeType, prizeValue, couponDiscount} = data;
          if (prizeType === 4) {
            api.log(`获得现金 ${prizeValue}`);
            await apCashWithDraw(data);
            await sleep(5);
          } else if (prizeType === 2) {
            api.log(`获得红包 ${prizeValue}`);
          } else if (prizeType === 1) {
            api.log(`获得优惠券 ${couponDiscount}-${prizeValue}`);
          } else {
            api.log(`获得 ${JSON.stringify(data)}`);
          }
        }
      }
    }

    async function apCashWithDraw({id, poolBaseId, prizeGroupId, prizeBaseId, prizeType}) {
      return api.doFormBody('apCashWithDraw', {
        'businessSource': 'NONE',
        'base': {
          id, poolBaseId, prizeGroupId, prizeBaseId, prizeType,
          'business': 'fission',
        },
      }).then(data => {
        const amount = _.get(data, 'data.record.amount');
        if (amount) {
          api.log(`正在提现${amount}`);
        } else {
          api.log(data.data);
        }
      });
    }

    async function handleDoShare() {
      const inviter = self.getShareCodeFn()[0];
      inviter && await api.doFormBody('inviteFissionhelp', {isJdApp: true, inviter}).then(data => {
        const {helpResult, nickName} = data.data;
        if (helpResult === 1) {
          api.log(`给 ${nickName} 助力成功`);
        } else {
          api.log(`给 ${nickName} 助力失败(${helpResult === 6 ? '已助力过' : '没有次数'})`);
        }
      });
    }
  }
}

singleRun(Fission).then();

module.exports = Fission;
