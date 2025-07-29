const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, matchMiddle} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

const linkIdConfigs = [
  ['Tr-2uOIVe2s44vZznBcoBw', 'https://prodev.m.jd.com/mall/active/3TQt6djGMAzDVdTe519oCXjZd3XR/index.html?stath=47&navh=44&taskId=6238&from=kouling&activityChannel=jdapp&femobile=femobile&tttparams=TwnjAzSiieyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMzI0MTE4OTU4NSIsImxhdCI6IjAuMDAwMDAwIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjBfMF8wXzAiLCJsbmciOiIwLjAwMDAwMCIsInVlbXBzIjoiMC0wLTAiLCJnTG5nIjoiMTEzLjQ3NDgwMSIsIm1vZGVsIjoiaVBob25lMTMsMyIsImRMbmciOiIifQ9%3D%3D&inviter=xaxWXY5sf2Qou4xX2THKNA'],
  ['QBYU-YKBKNQeLRJIaFTFog', 'https://pro.m.jd.com/mall/active/4AmRjcUVTjihVZVmpKjCm8tTxggV/index.html?stath=47&navh=44&taskId=6239&from=kouling&activityChannel=jdapp&femobile=femobile&tttparams=iAMGjzNdeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMzI0MTE4OTU4NSIsImxhdCI6IjAuMDAwMDAwIiwicG9zTGF0IjoiMjIuOTQyOTA2IiwicmZzIjoiMDAwMCIsInBvc0xuZyI6IjExMy40NzQ4MDEiLCJncHNfYXJlYSI6IjBfMF8wXzAiLCJsbmciOiIwLjAwMDAwMCIsInVlbXBzIjoiMC0wLTAiLCJnTG5nIjoiMTEzLjQ3NDgwMSIsIm1vZGVsIjoiaVBob25lMTMsMyIsImRMbmciOiIifQ8%3D%3D&inviter=xaxWXY5sf2Qou4xX2THKNA'],
  ['efwSCgMYmMaufIsC4qgfIA', 'https://prodev.m.jd.com/mall/active/2tCyuWWrv9h7KbVMZaUs4madVg93/index.html?stath=47&navh=44&utm_user=plusmember&utm_term=96c87cd27ada431aaee7b2291d0d5237&utm_source=lianmeng__2__kong&tttparams=ENmImsxeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDIiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMzI0MTE4OTU4NSIsImxhdCI6IjIyLjk2ODE2NyIsInBvc0xhdCI6IjIyLjk0MjkwNiIsInJmcyI6IjAwMDAiLCJwb3NMbmciOiIxMTMuNDc0ODAxIiwiZ3BzX2FyZWEiOiIxOV8xNjAxXzM2OTUzXzUwNDAwIiwibG5nIjoiMTEzLjQ4ODE4NSIsInVlbXBzIjoiMC0wLTAiLCJnTG5nIjoiMTEzLjQ3NDgwMSIsIm1vZGVsIjoiaVBob25lMTMsMyIsImRMbmciOiIifQ7%3D%3D&ad_od=share&utm_medium=jingfen&rid=10109&_ts=1723133357334&cu=true&utm_campaign=t_1000360641_&gx=RnAomTM2bWCIzp1Eq9d1CzeahAJsaq0&gxd=RnAowDNbPWDfnckcrId2D03xPfj4oi_LW80sw7zecj5Xa0zpWj_9V6tFWJbRJA8'],
];

class SuperLeague extends Template {
  static scriptName = 'SuperLeague';
  static scriptNameDesc = '抽超市卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '13.1.0',
  });
  static keepIndependence = true;
  static times = 2;
  static needInAppDynamicTime = true;
  static needOriginProMd = true;
  static activityEndTime = '2025-06-30';

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

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

    for (const [id, url] of linkIdConfigs) {
      await _do(await api.doGetUrl(url).then((data => matchMiddle(data, {reg: /"linkId":"([^"']*)"/}))) || id);
    }

    async function _do(linkId) {
      const doFormBody = (functionId, body) => api.doFormBody(functionId, _.assign({linkId}, body));
      if (!linkId) {
        return api.log(`没找到 linkId(${linkId})`);
      }

      const stop = await handleDoTask();

      if (stop) {
        return api.log(`linkId(${linkId})无效`);
      }
      self.isLastLoop() && await handleLottery();

      async function handleDoTask() {
        const taskList = await doFormBody('apTaskList').then(_.property('data'));
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
            const {userCode} = await doFormBody('superLeagueHome').then(_.property('data'));
            self.updateShareCodeFn(userCode);
            for (const inviter of self.getShareCodeFn()) {
              await doFormBody('superLeagueHome', {taskId, inviter, inJdApp: true});
            }
            continue;
          }
          if (taskFinished || /助力/.test(taskTitle) || ['FOLLOW_CHANNEL'].includes(taskType)) continue;
          const channel = 4;
          const {taskItemList} = await doFormBody('apTaskDetail', {
            taskType,
            taskId,
            channel,
          }).then(_.property('data')) || {};
          taskItemList && await self.loopCall(taskItemList, {
            times,
            maxTimes,
            async firstFn({itemId}) {
              await sleep(2);
              return doFormBody('apsDoTask', {taskType, taskId, channel, itemId});
            },
          });
        }
      }

      async function handleLottery() {
        const {remainTimes} = await doFormBody('superLeagueHome').then(_.property('data'));
        for (let i = 0; i < remainTimes; i++) {
          await doFormBody('superLeagueLottery').then(data => {
            api.log(`抽奖获得 ${_.get(data, 'data.codeDesc') || '空气'}(${_.get(data, 'data.prizeDesc')})`);
          });
          await sleep(2);
        }
      }
    }
  }
}

singleRun(SuperLeague).then();

module.exports = SuperLeague;
