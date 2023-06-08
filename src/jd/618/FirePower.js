const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {sleepTime} = require('../../lib/cron');
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

    api.cookieInstance.set('CSID', 'QTw9HCRRUlEBQloMWUdYTlFmdSlwflNaF1gDABcMDFVqe3Z7d3hxchVWVS1TWlRWWndgYAxeRBVnZBlzXF9aOkBSQFxCWllZYXJmdnlX');
    // await api.doGetUrl('https://u.jd.com/OzlWBuX', {
    //   setCookieKeys: ['CSID'],
    // });
    await api.doGetUrl('https://u.jd.com/jda?e=618%7Cpc%7C&p=JF8BAQIJK1olXDYDZBoCUBVIMzZNXhpXVhgcFR0DXR9QHDMXQA4KD1heSgINVRYJUz1NQxxBQwRdKwICTTRURzhjQAF-KgZrLyUnUhRiRx1bSzsLBVlXABdCUQ5LXmFMRANLAnZQESYIBEkXA2gLK15UDXB2Eh4tajhHUxBRSxwdPQICKS5RBHsSA24JH18TWAUEZF5cCUkUBWwBGlslbQYBZBUzCXsVA24JG1wWXAIBZF5aAU8UBWwKEl4TVAUyU15UOJ6Yr7qHt1kWWQIBVm5tCksXBGw4GGsSXQ8WUiwcWl8RcV84G1wlXjYyVl9cDEInM3ZqbjpDPQVWESMVWAAfXW9rA2s&a=fCg9UgoiAwwHO1BcXkQYFFljfn51cl5eQl0zVRBSUll%2bAQAPDSwjLw%3d%3d&refer=norefer&d=OzlWBuX&h5st=-1917063884', {
      headers: {
        referer: 'https://u.jd.com/OzlWBuX',
      },
      setCookieKeys: ['unpl'],
    });

    self.injectEncryptH5st(api, {
      config: {
        queryFullGroupInfoMap: {appId: '6a98d'},
        doInteractiveAssignment: {appId: '6a98d'},
        getCoupons: {appId: '6a98d'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    const unionActId = '31162';
    const actId = '3nNmntNrufZjkZF1XJJKknDuCbaQ';

    const needGetCoupons = _.first(self._command);
    if (needGetCoupons && api.isFirst) {
      console.log('等待 20 点定时执行...');
      await sleepTime(20);
    }

    await self.beforeRequest(api);

    if (needGetCoupons) {
      // 领取/助力
      await api.doFormBody('getCoupons', {
        actId, unionActId,
        'platform': 2,
        // 'd': 'OzlWBuX',
        'unionShareId': '',
        'type': 1,
      }).then(data => api.clog(JSON.stringify(data)));
      await sleep(2);
      await api.doFormBody('getCoupons', {
        actId, unionActId,
        'platform': 2,
        'd': 'OzlWBuX',
        'unionShareId': '',
        'type': 1,
      }).then(data => api.clog(JSON.stringify(data)));
      return;
    }

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
        actId, unionActId,
        'platform': 4,
        // 'd': 'auHULYP',
        'taskType': 1,
        'prstate': 0,
      }).then(_.property('data'));
    }
  }
}

singleRun(FirePower).then();

module.exports = FirePower;
