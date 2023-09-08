const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

const linkId = '3orGfh1YkwNLksxOcN8zWQ';

class Fission extends Template {
  static scriptName = 'Fission';
  static scriptNameDesc = '转赚红包(助力)';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '12.1.0',
    'x-api-eid-token': 'jdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKOPHK46QAAAAACCZQAFBPMWYNMYX',
  });
  static keepIndependence = true;
  static needInAppComplete1 = true;
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html',
          'referer': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html?from=kouling&channelType=0&activityChannel=jdapp&femobile=femobile&tttparams=IwMiiIeyJnTGF0IjoiMjIuOTQzMTA1IiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiIxMDczMjg0NTYxNSIsImxhdCI6IjIzLjA3NDEyMSIsInBvc0xhdCI6IjIyLjk0MzEwNSIsInBvc0xuZyI6IjExMy40NzQ3MTgiLCJncHNfYXJlYSI6IjE5XzE2MDFfNTAyODNfNTAzODYiLCJsbmciOiIxMTMuNDIzNzIwIiwidWVtcHMiOiIwLTAtMiIsImdMbmciOiIxMTMuNDc0NzE4IiwibW9kZWwiOiJpUGhvbmUxMywzIiwiZExuZyI6Ii6J9&originId=3orGfh1YkwNLksxOcN8zWQ&inviteCode=voN1y2F4JuplvN6EKiBjFb5EWF8ptYq8YK4yKJsXyUs&inviterId=CeymEOdTGnhBzMjmwC12IA',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        wheelsHome: {appId: 'c06b7'},
        inviteFissionHome: {appId: 'eb67b'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const {data: {inviter, inviteCode}} = await api.doFormBody('inviteFissionHome');
    if (api.isFirst) {
      self.shareCode = {inviter, inviteCode};
    } else {
      // TODO 确认助力逻辑
      await api.doFormBody('inviteFissionHome', _.pick(self.shareCode, ['inviter']));
    }
  }
}

singleRun(Fission).then();

module.exports = Fission;
