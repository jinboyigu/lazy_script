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
    appid: 'u_hongbao',
    loginType: 2,
    client: 'apple',
    clientVersion: '12.1.6',
  });
  static activityEndTime = '2023-11-11';
  static concurrent = () => this._command[0];

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://pro.m.jd.com',
          referer: 'https://pro.m.jd.com/mall/active/39WF8DJPB4DByGz4Ly9EHeKvJz54/index.html?unionActId=31165&abPageType=1&uabt=305_2082_1-302_2196_1_1&d=0ivOeC8&s=&cu=true&utm_source=kong&utm_medium=jingfen&utm_campaign=t_1003272801_&utm_term=5df8d73acec741c1aabb841f2e07adb5',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    // await api.doGetUrl('https://u.jd.com/0ivOeC8', {
    //   setCookieKeys: ['CSID'],
    // });
    // CSID 需从 charles 中获取, 不然可能会无效
    api.cookieInstance.set('CSID', 'RG1qGCNQWAtcQQBcWU9cQlAwdHl9LF8NFQtUBRFZWwVqe3Z7d3hxchVWVS1TWlRWWnZmYA5SRBRvZBhzXFldOkdRXkNHV0BGYHVmdXtS');
    await api.doGetUrl('https://u.jd.com/jda?e=99_1|1_28|||&p=JF8BAPEJK1olXDYDZBoCUBVIMzZNXhpXVhgcFR0DFxcIWDoXSQVJQ1pSCQNDWBlSWyhcBV5pVXRBMgkieiwVYApUaQhGPVVECFw1YCBcRAYWQwRACU8dDRsBVUVTXDdWRCtHGH5XWFxdCEwTMytURRNXJ2d2MT1HTDBgGSthbDtrD0AOWG5cOEsWAm0LHVgcXAYyZF5ZOAB5Al8JK1sSVQAKXFxfDksSB2g4G10liImugdHxCkgTB2wKK2sXXQYFUG5eOEMfbW9FGzUWVEtPGW5tCEwnAF84GFoUXAYyZIDQuC5iYTULaA8WBnBlFjwDcUnJjt84&a=fCg9UgoiAwwHO1BcXkQYFFljf3B1e1FWQFozVRBSUll%2bAQAPDSwjLw%3d%3d&refer=norefer&d=0ivOeC8&h5st=952551976', {
      headers: {
        referer: 'https://u.jd.com/0ivOeC8',
      },
      setCookieKeys: ['unpl'],
    });

    self.injectEncryptH5st(api, {
      config: {
        queryFullGroupInfoMap: {appId: '7b74b'},
        doInteractiveAssignment: {appId: '7b74b'},
        getCoupons: {appId: 'c822a'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    const unionActId = '31165';
    const actId = '27F8qXYtc6pi1sjybdSavaLjSvBL';
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
        const {status, joinNum} = _.last(_.get(data, 'longGroupData.groupInfo', [])) || {};
        if (status === 2) {
          throw api.log(`火力值已达到最高值 ${joinNum}`);
        }
        return _.get(data, 'dayGroupData.groupInfo', []);
      });

      for (const {projectId: encryptProjectId, taskId: encryptAssignmentId, status, showInfo} of groupInfo) {
        if (status !== 1 || !encryptAssignmentId) continue;
        if (showInfo.match('分享活动抽盲盒')) continue; // 不需要执行的任务(基本无收益)
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
        'platform': 1,
        unionShareId,
      };
      const options = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2e) NetType/WIFI Language/zh_CN',
        },
      };
      // 先检查是否有次数
      const {code, msg} = await api.doFormBody('showCoupon', body, void 0, options);
      if (code !== 0) {
        api.clog('可能是 CSID 失效了')
        return api.clog(msg);
      }
      await api.doFormBody('getCoupons', {
        ...body,
        'type': 1,
      }, void 0, options).then(data => {
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
