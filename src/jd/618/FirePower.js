const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class FirePower extends Template {
  static scriptName = 'FirePower';
  static scriptNameDesc = '火力';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static times = 1;
  static needInAppComplete1 = true;
  static commonParamFn = () => ({
    appid: 'u',
    loginType: 2,
    client: 'apple',
    clientVersion: '12.0.2',
  });
  static keepIndependence = true;
  static activityEndTime = '2023-06-18';

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    api.cookieInstance.add('unpl=JF8EALFnNSttWE1SUE5RSBNATQ1SWwpYSUQFOGBVUV1RTlEGHwASGxZ7XlVdXxRKEB9uYRRUXFNKVQ4bBisSE3tdVV9fC00UCm5nNWRaWEIZRElPKxEQe1xkXloOTRIEa2ECU15QTlQGGgcfERRLXFRuXQ57EANmVzVkWFhKVQEfBB4RFntcZFxdCUoXBGxmAVdtEyVVSBsFHRQVTFlSWVoLQxIDbGYAUF5cS1UFKwAbEhdIbVc');

    self.injectEncryptH5st(api, {
      config: {
        queryFullGroupInfoMap: {appId: '6a98d'},
        doInteractiveAssignment: {appId: '6a98d'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await handleDoTask();

    const joinNum = await queryFullGroupInfoMap().then(_.property('longGroupData.joinNum'));
    api.log(`当前火力值: ${joinNum || 0}`);

    async function handleDoTask() {
      const groupInfo = await queryFullGroupInfoMap().then(data => {
        if (data.code === 1) {
          throw api.clog(data.msg, false);
        }
        return _.get(data, 'dayGroupData.groupInfo', []);
      });

      for (const {projectId: encryptProjectId, taskId: encryptAssignmentId, status, showInfo} of groupInfo) {
        if (status !== 1 || !encryptAssignmentId) continue;
        const body = {
          encryptProjectId,
          encryptAssignmentId,
          'sourceCode': 'ace36658',
          'actionType': 1,
          'itemId': '1',
        };
        const waitDuration = _.last(showInfo.match(/(\d+)秒/));
        await api.doGetBody('doInteractiveAssignment', body);
        body.actionType = 0;
        await sleep(waitDuration);
        await api.doGetBody('doInteractiveAssignment', body);
      }
    }

    function queryFullGroupInfoMap() {
      return api.doGetBody('queryFullGroupInfoMap', {
        'actId': '3nNmntNrufZjkZF1XJJKknDuCbaQ',
        'unionActId': '31162',
        'platform': 4,
        'd': 'auHULYP',
        'taskType': 1,
        'prstate': 0,
      }).then(_.property('data'));
    }
  }
}

singleRun(FirePower).then();

module.exports = FirePower;
