const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, matchMiddle} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

let linkId = '';

class SuperLeague extends Template {
  static scriptName = 'SuperLeague';
  static scriptNameDesc = '抽超市卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.0',
  });
  static keepIndependence = true;
  static times = 2;
  static needInAppDynamicTime = true;
  static needOriginProMd = true;
  static originUrl = 'https://prodev.m.jd.com/mall/active/3TQt6djGMAzDVdTe519oCXjZd3XR/index.html?stath=47&navh=44&taskId=6238&from=kouling&activityChannel=jdapp&femobile=femobile&tttparams=TwnjAzSiieyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMzI0MTE4OTU4NSIsImxhdCI6IjAuMDAwMDAwIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjBfMF8wXzAiLCJsbmciOiIwLjAwMDAwMCIsInVlbXBzIjoiMC0wLTAiLCJnTG5nIjoiMTEzLjQ3NDgwMSIsIm1vZGVsIjoiaVBob25lMTMsMyIsImRMbmciOiIifQ9%3D%3D&inviter=xaxWXY5sf2Qou4xX2THKNA';

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    const originUrl = self.originUrl;
    await api.doGetUrl(originUrl).then((data => {
      const newLinkId = matchMiddle(data, {reg: /"linkId":"([^"']*)"/});
      if (newLinkId === linkId) return;
      linkId = newLinkId;
    }));

    self.injectEncryptH5st(api, {
      config: {
        superLeagueHome: {appId: 'b7d17'},
        superLeagueLottery: {appId: '60dc4'},
        apsDoTask: {appId: '54ed7'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    if (!linkId) {
      return api.log('没找到 linkId');
    }

    const stop = await handleDoTask();

    if (stop) {
      return api.log(`linkId(${linkId})无效`);
    }
    self.isLastLoop() && await handleLottery();

    async function handleDoTask() {
      const taskList = await api.doFormBody('apTaskList').then(_.property('data'));
      if (!taskList || !_.isArray(taskList)) return true;
      for (const {
        id: taskId,
        taskType,
        taskTitle,
        taskLimitTimes: maxTimes,
        taskDoTimes: times,
        taskFinished
      } of taskList || []) {
        if (/助力/.test(taskTitle)) {
          const {userCode} = await api.doFormBody('superLeagueHome').then(_.property('data'));
          self.updateShareCodeFn(userCode);
          for (const inviter of self.getShareCodeFn()) {
            await api.doFormBody('superLeagueHome', {taskId, inviter, inJdApp: true});
          }
          continue;
        }
        if (taskFinished || /助力/.test(taskTitle) || ['FOLLOW_CHANNEL'].includes(taskType)) continue;
        const channel = 4;
        const {taskItemList} = await api.doFormBody('apTaskDetail', {
          taskType,
          taskId,
          channel,
        }).then(_.property('data')) || {};
        taskItemList && await self.loopCall(taskItemList, {
          times,
          maxTimes,
          async firstFn({itemId}) {
            await sleep(2);
            return api.doFormBody('apsDoTask', {taskType, taskId, channel, itemId});
          },
        });
      }
    }

    async function handleLottery() {
      const {remainTimes} = await api.doFormBody('superLeagueHome').then(_.property('data'));
      for (let i = 0; i < remainTimes; i++) {
        await api.doFormBody('superLeagueLottery').then(data => {
          api.log(`抽奖获得 ${_.get(data, 'data.codeDesc') || '空气'}(${_.get(data, 'data.prizeDesc')})`);
        });
        await sleep(2);
      }
    }
  }
}

singleRun(SuperLeague).then();

module.exports = SuperLeague;
