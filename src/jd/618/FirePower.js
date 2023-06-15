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
  static concurrent = () => this._command[0];

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
    const d = ''; // 邀请码

    const getCouponCronHour = _.first(self._command);
    if (getCouponCronHour) {
      api.clog(`等待 ${getCouponCronHour} 点定时执行...`);
      await sleepTime(getCouponCronHour);
    }

    await self.beforeRequest(api);

    if (getCouponCronHour) {
      await getCoupons();
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
        const {status, joinNum} = _.last(_.get('longGroupData.groupInfo', [])) || {};
        if (status === 2) {
          api.log(`火力值已达到最高值 ${joinNum}`);
          return [];
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
        actId, unionActId, d,
        'platform': 4,
        'taskType': 1,
        'prstate': 0,
      }).then(_.property('data'));
    }

    // 领取/助力
    async function getCoupons(unionShareId = '') {
      const body = {
        actId, unionActId, d,
        'platform': 2,
        unionShareId,
      };
      // 先检查是否有次数
      const {code, msg} = await api.doFormBody('showCoupon', body);
      if (code !== 0) {
        return api.clog(msg);
      }
      await api.doFormBody('getCoupons', {
        ...body,
        'type': 1,
      }).then(data => {
        const coupon = _.get(data, 'data.couponList[0]');
        if (!coupon) return api.clog(data.msg);
        const typeLabel = ['', '红包', '', '优惠券'];
        const label = typeLabel[coupon.type];
        !label && api.log(coupon);
        api.clog(`获得 ${coupon.discount}(${label || coupon.type})`);
      });
    }
  }
}

singleRun(FirePower).then();

module.exports = FirePower;
