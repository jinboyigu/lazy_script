const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');

const biz = 'interact';

class Earn extends Template {
  static scriptName = 'Earn';
  static scriptNameDesc = '赚赚小程序-赚好礼';
  static shareCodeTaskList = [];
  static times = 1;
  static commonParamFn = () => ({});
  static cookieKeys = ['wq_uin', 'wq_skey'];
  // 签到已下线
  // static activityEndTime = '2023-03-14 11:00:00';
  // 整体下线
  static activityEndTime = '2023-04-20 10:00:00';

  static apiOptions = {
    signData: {
      appid: 'wh5',
      loginType: '1',
      loginWQBiz: biz,
      g_ty: 'ls',
      g_tk: 'returnMoney',
      clientVersion: '1.0.0',
    },
  };

  static isSuccess(data) {
    return _.property('code')(data) === '0';
  }

  static async beforeRequest(api) {
    return !await this.updateWqAuthToken(api);
  }

  static apiNamesFn() {
    const self = this;

    return {
      // 获取任务列表
      getTaskList: {
        name: 'interactTaskIndex',
        // paramFn: () => ({'mpVersion': '3.0.6'}),
        successFn: async (data, api) => {
          // writeFileJSON(data, 'interactTaskIndex.json', __dirname);

          if (!self.isSuccess(data)) return [];

          const result = [];

          // 助力
          for (const itemId of self.shareCodeTaskList) {
            // TODO 暂时移除
            break;
            await api.doFormBody('interactIndex', {itemId, taskId: 3}).then(data => {
              const helpDesc = _.property('data.helpRes.helpResDesc')(data);
              helpDesc && api.log(helpDesc);
            });
          }

          const taskList = _.property('data.taskDetailResList')(data) || [];
          for (let {
            status,
            taskId,
            taskToken,
            maxTimes,
            times,
            waitDuration,
          } of taskList) {
            if (status === 2 || [3/* 每日分享 */].includes(taskId)) continue;

            if (taskId === 1 /*签到有礼*/) {
              times = 0;
              maxTimes = 1;
            }

            let list = [];
            for (let i = times; i < maxTimes; i++) {
              list.push({taskId, taskToken});
            }

            result.push({list, option: {maxTimes, times, waitDuration}});
          }

          return result;
        },
      },
      doTask: {
        name: 'doInteractTask',
        paramFn: o => o,
      },
      doRedeem: {
        name: 'interactTaskIndex',
        async successFn(data, api) {
          if (!self.isSuccess(data)) return api.log(data.message);
          const helpMainResListLength = (_.property('data.helpMainResList')(data) || []).length;
          const msgs = [
            `已助力人数为: ${helpMainResListLength}`,
            `cash: ${data.data.cashExpected}`,
          ];
          api.log(msgs.join(', '));
        },
      },
    };
  };

  static initShareCodeTaskList(shareCodes) {
    if (shareCodes) {
      this.shareCodeTaskList = shareCodes;
    }
  }

  static async doMain(api) {
    const self = this;
    await self.beforeRequest(api);
    const prizeListData = await api.doFormBody('getExchangePrizeList');
    if (!self.isSuccess(prizeListData)) return;
    const {data: {totalNum, cashExpected, exchangePrizeList}} = prizeListData;
    api.log(cashExpected);

    for (const {prizeAmount, prizeId} of exchangePrizeList.reverse()) {
      if (totalNum / 10000 > prizeAmount) {
        const stop = await exchangePrize(prizeId);
        if (stop) break;
        await sleep(10);
        await api.doFormBody('getExchangePrizeList');
      }
    }

    async function exchangePrize(prizeId) {
      return api.doFormBody('exchangePrize', {prizeId}).then(data => {
        if (self.isSuccess(data)) {
          api.log(`成功兑换 ${data.data.prizeName}`);
          return true;
        }
        api.log(data.message);
        if (data.subCode === 'E101') {
          return true;
        }
      });
    }
  }
}

singleRun(Earn).then();

module.exports = Earn;
