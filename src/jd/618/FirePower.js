const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {sleepTime} = require('../../lib/cron');
const _ = require('lodash');
const {getEnv} = require('../../lib/env');

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
    clientVersion: '13.2.10',
  });
  static activityEndTime = '2024-11-11';
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
    api.cookieInstance.set('CSID', 'Rjo9HXBSXgpcEwFcWU8NFApjJSsnLABeFFheVxRdDgJqe3Z7d3hxchVWVS1TWlRRWnZmYA1SRBRsZBt5XFtfOkdRXkNEXUdGbXBmc3s%3d');
    await api.doGetUrl('https://u.jd.com/jda?e=99_1|1_28|||&p=JF8BAPEJK1olXDYDZBoCUBVIMzZNXhpXVhgcFR0DFxcIWDoXSQVJQ1pSCQNDWBlSWyhcBSlNFVhdIA5YDitsQyxMXF9HBlR2DVg2ezleUXFQRA5BFBlbEQIABg9IWzFXawlQJVMOVl5dAEgnXWhPYxtpA2ZnEA4fYDRidCxIQDlxLQoOZF9tCEoWAWwOGFIUXTYyVFptQyUWM244G10WVA8EUFpcC0oUA18IHWvA0qrX2_JfC08TAG04K1kVXQ4BZF1tAEN5AyIIdVgcEEtPZG5dD3sUM18LGloUXTYyitDJdzhlYB8IfwlWIgYCKwdbaZWZl184&a=fCg9UgoiAwwHO1BcXkQYFFlidHB8fV9bRFgzVRBSUll%2bAQAPDSwjLw%3d%3d&refer=norefer&d=COquWpM&h5st=-555503503', {
      headers: {
        referer: 'https://u.jd.com/COquWpM',
      },
      setCookieKeys: ['unpl'],
    });

    self.injectEncryptH5st(api, {
      config: {
        queryFullGroupInfoMap: {appId: '7b74b'},
        doInteractiveAssignment: {appId: '7b74b'},
        shareUnionCoupon: {appId: 'c10dc'},
        unionShare: {appId: '18813'},
        getCoupons: {appId: 'c822a'},
        completeUnionTask: {appId: '66248'},
        getUnionFreeCoupon: {appId: '66248'},
        apStartTiming: {appId: '0d977'},
        unionSearchRecommend: {appId: '66248'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    // TODO 待移除
    const unionShareIds = getEnv('JD_FIREPOWER_UNIONSHAREIDS') || [];

    const unionActId = '31192';
    const actId = '2QPgcbnrRzSas2AFvNxFrcXb73zi';
    const d = ''; // 短链接(?s=$d)

    const getCouponCronHour = _.first(self._command);
    const needGetCoupon = !_.isNil(getCouponCronHour);
    if (needGetCoupon) {
      api.clog(`等待 ${getCouponCronHour} 点定时执行...`);
      await sleepTime(getCouponCronHour);
    }

    await self.beforeRequest(api);

    if (needGetCoupon) {
      await getCoupons();
      return;
    }

    if (self.getNowHour() === 0) {
      await getCoupons();
    }
    await handleDoTask();

    // TODO 本次不需要
    // const joinNum = await queryFullGroupInfoMap().then(_.property('longGroupData.joinNum'));
    // api.log(`当前火力值: ${joinNum || 0}`);

    async function handleDoTask() {
      const groupInfo = await queryFullGroupInfoMap().then(data => {
        if (data.code === 1) {
          throw api.logBoth(data.msg, false);
        }
        return _.get(data, 'dayGroupData.groupInfo', []);
      });
      // 随机生成7位
      const wordRandom = (length = 7) => {
        const words = [];
        for (let i = 65; i < 90; i++) {
          words.push(String.fromCharCode(i));
        }
        words.push(...words.map(v => v.toLowerCase()));
        for (let i = 0; i < 10; i++) {
          words.push(`${i}`);
        }
        return Array(length).fill().map(() => words[_.random(0, words.length - 1)]).join('');
      };
      const doShareTask = async taskId => {
        const baseBody = {
          unionActId,
          'actId': 'ahzKcXspskaU1aRUQvrTBehkrHk',
          'platform': 4,
          unionShareId: '',
          'd': wordRandom(),
          taskId,
        };
        // 生成的链接是假的
        const plainUrl = await api.doGetBody('shareUnionCoupon', {
          ...baseBody,
          'supportPic': 2,
        }).then(_.property('data.shareUrl'));
        if (0) { // 目前不需要生成文字分享链接也可以完成任务
          await api.doGetBody('unionShare', {
            'funName': 'share',
            'param': {'shareReq': [{'shareType': 5, plainUrl, 'command': 1}]},
          });
        }
        if (plainUrl) {
          await api.doFormBody('getCoupons', {
            ...baseBody,
            'type': 8,
            'qdPageId': 'MO-J2011-1',
            'mdClickId': 'jxhongbao_ck',
            'agreeState': 0,
          }).then(logGetCoupon.bind(0, '分享抽奖'));
          // 获取每天任务红包. 暂时不开启 TODO
          0 && await api.doFormBody('getCoupons', {
            ...baseBody,
            'type': 3,
            'qdPageId': 'MO-J2011-1',
            'mdClickId': 'jxhongbao_ck',
          }).then(logGetCoupon.bind(0, '每天打卡'));
        }
      };

      let successTimes = 0;
      for (const {
        projectId: encryptProjectId,
        taskId,
        status,
        showInfo,
        adInfo,
        taskTargetUrl
      } of groupInfo) {
        if (status !== 1) continue;
        // 分享任务
        if (/分享/.test(showInfo)) {
          await doShareTask(taskId);
        } else if (/浏览/.test(showInfo)) {
          const waitDuration = _.last(showInfo.match(/(\d+)秒/));
          await api.doFormBody('apStartTiming', {
            'timerId': 'bJEwwhJl',
            'uniqueId': taskId,
            'jumpUrl': encodeURIComponent(adInfo.target_url),
            'jumpType': 1,
          });
          await api.doSign('apResetTiming', {
            'timerId': 'bJEwwhJl',
            'uniqueId': taskId,
          });
          await sleep(waitDuration);
          await api.doSign('apCheckTimingEnd', {
            'timerId': 'bJEwwhJl',
            'uniqueId': taskId,
          });
          await queryFullGroupInfoMap();
        } else if (/点击/.test(showInfo)) {
          let unionActTask = new URL(taskTargetUrl).searchParams.get('unionActTask');
          await api.doFormBody('unionSearchRecommend', {
            'funName': 'getSkuByMaterialId',
            'page': {'pageNo': 1, 'pageSize': 20},
            'param': {
              'materialId': 12354,
              'sortName': null,
              'sortType': '',
              'keyword': '',
              'category1': null,
              'batchId': '',
              'requestScene': 1,
              'source': 20200,
              'clientPageId': 'union_activity_265222',
              'packageName': '',
            },
          }, {appid: 'u_activity_h5'}).then(async data => {
            const list = _.get(data, 'result.goodsSynopsisList');
            let i = 0;
            for (const item of list) {
              const couponUrl = _.get(item, 'purchasePriceInfo.unionCouponList.0.couponLink');
              if (!couponUrl) continue;
              const success = await api.doGetBody('getUnionFreeCoupon', {
                'couponUrl': couponUrl,
                'recommendCouponUrl': [couponUrl],
                'skuPrice': item.wlPrice,
                'pageId': 265222,
                'pageType': 5,
                'source': 20221,
              }, {qs: {appid: 'u_activity_h5'}}).then(data => data);
              await sleep(2);
              if (success) ++i;
              if (i >= 4) {
                await api.doFormBody('completeUnionTask', {unionActTask}, {appid: 'u_activity_h5'});
                break;
              }
            }
          });
        }
      }
      if (successTimes) {
        api.log(`成功完成任务 ${successTimes} 次`);
      } else if (!_.isEmpty(groupInfo)) {
        api.logBoth(`今天任务已完成`);
        await getCoupons(void 0, 3);
      }
    }

    function queryFullGroupInfoMap() {
      return api.doGetBody('queryFullGroupInfoMap', {
        actId, unionActId, d,
        'platform': 3,
        'taskType': 1,
        'prstate': 0,
      }).then(_.property('data'));
    }

    // 领取/助力
    async function getCoupons(unionShareId = '', type = 1) {
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
      if (type === 1) {
        // 先检查是否有次数
        const {code, msg} = await api.doFormBody('showCoupon', body, void 0, options);
        if (code !== 0) {
          api.clog('可能是 CSID 失效了');
          return api.clog(msg);
        }
      }
      await api.doFormBody('getCoupons', {
        ...body,
        type,
      }, void 0, options).then(logGetCoupon);
    }

    function logGetCoupon(name = '', data) {
      if (_.isPlainObject(name)) {
        data = name;
        name = '';
      }
      const coupon = _.get(data, 'data.couponList[0]');
      if (!coupon) return api.clog(data.msg);
      const typeLabel = ['', '红包', '', '优惠券', '', '', '优惠券'];
      const label = typeLabel[coupon.type];
      !label && api.log(coupon);
      api.logBoth(`${name}获得 ${coupon.discount}(${label || coupon.type})`);
    }
  }
}

singleRun(FirePower).then();

module.exports = FirePower;
