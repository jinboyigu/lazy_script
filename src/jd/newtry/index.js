const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class NewTry extends Template {
  static scriptName = 'NewTry';
  static scriptNameDesc = '逛新品赢红包';
  static dirname = __dirname;
  static defaultShareCodes = [
    'Sv_h1QhgY81XeKR6b1A',
    'S7a4gE0Ic8A',
    'S-akZNEhNqhCPQUKp84M',
    'S5KkcMWdhhwWERkeG8q5f',
    'S5KkcRkoZ_ALUdROgkqIJdw',
  ];
  static commonParamFn = () => ({
    appid: 'newtry',
    client: 'ios',
    clientVersion: '13.2.10',
  });
  static keepIndependence = true;
  static times = 1;
  static needInAppDynamicTime = true;
  static needOriginProMd = true;

  static isSuccess(data) {
    return _.get(data, 'subCode') === '0';
  }

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        qryH5BabelFloors: {appId: '35fa0'},
        luban_executeWorkflow: {appId: '35fa0'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();
    // await handleLottery();

    async function qryH5BabelFloors() {
      const floorKey = '102983671';
      return api.doFormBody('qryH5BabelFloors', {
        'activityId': '2m5K4HvCV4jNeTDixt56KGjroeLT',
        'pageId': '4810055',
        'queryFloorsParam': {'floorParams': {[floorKey]: {'assistEncId': '3EuHWFZQ48gWTfceH33RqAfAx9kY'}}, 'type': 2},
      }).then(_.property(`floorResponse.${floorKey}.providerData.data`));
    }

    async function handleDoTask() {
      const {assignments: {assignmentList}} = await qryH5BabelFloors();
      for (const {ext, encryptAssignmentId: encAid, completionFlag, assignmentName} of assignmentList) {
        if (completionFlag) continue;
        const {waitDuration, extraType, shoppingActivity} = ext;
        const _doTask = (action, itemId, url) => api.doFormBody('luban_executeWorkflow', {
          'workflowId': '5b7b7ba0683542e3838798b04e2d8e92',
          action,
          encAid,
          itemId,
          ...!action && {'completionFlag': true},
          jumpUrl: url,
        }).then(data => {
          if (action === 0 && self.isSuccess(data)) {
            const successRewards = Object.values(_.get(data, 'rewardsInfo.successRewards', {}))[0];
            if (successRewards) {
              api.log(`完成任务, 获得: ${successRewards.map(o => `${o.discount}${o.rewardName}`).join()}`);
            } else {
              api.log(`完成任务, 获取失败: ${_.get(data, 'rewardsInfo.failRewards[0].msg')}`);
            }
          }
        });
        // TODO 确认助力逻辑
        if (/助力/.test(assignmentName)) {
          const shareCodes = [].concat(self.defaultShareCodes);
          shareCodes.splice(api.currentCookieIndex, 1);
          for (const itemId of shareCodes) {
            await _doTask(0, itemId);
          }
          continue;
        }
        for (const o of [].concat(ext[extraType] || [])) {
          if (o.status === 2) continue;
          const itemId = o.itemId || o.skuId;
          const url = _.get(shoppingActivity, '[0].url');
          await _doTask(waitDuration ? 1 : 0, itemId, url);
          await sleep(waitDuration);
          waitDuration && await _doTask(0, itemId, url);
        }
      }
    }

    async function handleLottery() {
      const {lotteryConfigs} = await qryH5BabelFloors();
      if (!lotteryConfigs) {
        return;
      }
      const {chances: maxTimes, used: times} = lotteryConfigs;
      for (let i = times; i < maxTimes; i++) {
        await api.doFormBody('luban_executeWorkflow', {
          'workflowId': '5b7b7ba0683542e3838798b04e2d8e92',
          'action': 2,
          'completionFlag': true,
        }).then(data => {
          api.log(`抽奖获得 ${JSON.stringify(data.rewardsInfo)}`);
        });
        await sleep();
      }
    }
  }
}

singleRun(NewTry).then();

module.exports = NewTry;
