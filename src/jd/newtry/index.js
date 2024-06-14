const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class NewTry extends Template {
  static scriptName = 'NewTry';
  static scriptNameDesc = '逛新品赢红包';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'newtry',
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
    await handleLottery();

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
      for (const {ext, encryptAssignmentId: encAid, completionFlag} of assignmentList) {
        if (completionFlag) continue;
        const {waitDuration, extraType} = ext;
        const _doTask = (action, itemId) => api.doFormBody('luban_executeWorkflow', {
          'workflowId': '5b7b7ba0683542e3838798b04e2d8e92',
          action,
          encAid,
          itemId,
          ...!action && {'completionFlag': true},
        }).then(data => {
          if (action === 0 && self.isSuccess(data)) {
            api.log(`完成任务, 获得: ${Object.values(_.get(data, 'rewardsInfo.successRewards'))[0].map(o => `${o.discount}${o.rewardName}`).join()}`);
          }
        });
        for (const o of ext[extraType] || []) {
          if (o.status === 2) continue;
          const itemId = o.itemId || o.skuId;
          await _doTask(waitDuration ? 1 : 0, itemId);
          await sleep(waitDuration);
          waitDuration && await _doTask(0, itemId);
        }
      }
    }

    async function handleLottery() {
      const {lotteryConfigs: {chances: maxTimes, used: times}} = await qryH5BabelFloors();
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
