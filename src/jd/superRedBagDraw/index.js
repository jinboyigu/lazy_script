const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const {sleepTime} = require('../../lib/cron');
const {formatPasteData} = require('../../lib/charles');
const _ = require('lodash');

class SuperRedBagDraw extends Template {
  static scriptName = 'SuperRedBagDraw';
  static scriptNameDesc = '摇一摇';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    body: {'linkId': 'aE-1vg6_no2csxgXFuv3Kg'},
    appid: 'activity_platform_se',
    client: 'ios',
    clientVersion: '13.1.0',
    loginType: 2,
    loginWQBiz: 'wegame',
  });
  static needInAppDynamicTime = true;
  static keepIndependence = true;
  static times = 1;
  static activityEndTime = '2024-06-20';
  static needOriginProMd = true;
  static concurrent = true;
  static concurrentOnceDelay = 20;

  static isSuccess(data) {
    return data['code'] === 0;
  }

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        superRedBagDraw: {appId: '89cfe'},
        // 本地加密会报错
        // superRedBagList: {appId: 'f2b1d'},
        apCashWithDraw: {appId: '73bca'},
      },
      signFromSecurity: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);
    if (self.getNowHour() === 19) {
      if (api.currentCookieTimes === 0) {
        console.log(`等待19点30分后执行`);
      }
      await sleepTime([19, 30]);
      await superRedBagDraw();
    }
    await handleExchange();

    // 1 分钟摇一摇
    async function superRedBagDraw(isContinue = true) {
      /* TODO 后续可能需要直接用原数据 */
      const form = formatPasteData(`body\t{"linkId":"aE-1vg6_no2csxgXFuv3Kg"}
t\t1718364936610
appid\tactivity_platform_se
client\tios
clientVersion\t12.3.2
loginType\t2
loginWQBiz\twegame
h5st\t20240614193536637;iiiyg5i5ztn695i2;89cfe;tk03wd1dd1d0418nuI7HLOyl3rlAmuxiFhOjBb2MW-hoeV2vwVOpzbY7gsVr8lsDs7TUuG5UENYgcEof0_PXolIZu3TJ;83d216700c589d9c0c69da201c2d450dfb48448d83a84c1f3130faa1132ff254;4.7;1718364936637;TKmWNRTOL-4LqGbElsxi8AxtCFkA0eUOcvyYjOgUq7vg2_K8UM9N0bRc_mLJ2x3vExSbzMxaZ-bMUzzi9KBrb80vxzSoPYA2g-g1I_URRIT4CLQBqyppVxWweLzPcAhlGELSD4GmkzhNPsWgGDSDhp0IXsqJB1Ye--mdn30Bn4XDWr-H9e7zICL09ojrUcrhqUaQsl82NlwF-5YUeinLw2cy6qX79LRm1Od6OuDtw8RPsXPfBcsUeixl-jnGegu1O4tcTYhqgh1wz5UywQ4fUmWoQREV8-GQMrATm0yd53b4CSlQRFH3BxqCSreR1mAQlzAei3u-sIcjhORf9ODKHLBad5zBaWWsupYJ3sCn2jCh1P0M9JPFWwd1vKxN8QKg1ZWgOXsXz3QNtdyarVCEuhU6dsqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA
uuid\t072a16472e038821457fa13a510fcbcd014faf77
build\t169031
screen\t375*667
networkType\twifi
d_brand\tiPhone
d_model\tiPhone8,1
lang\tzh_CN
osVersion\t12.2
partner\t-1
x-api-eid-token\tjdd03KCWOTOKUUPOLJLBDBBU6UKQPIGXTIKYQNA5P5K7CHWY2XEYBA4SZN4IMQISKUH27F52QIYXRUNG6K6QSAZKW4JXPJIAAAAMQC2DMTLYAAAAADQH27YLMV3HTKUX
cthr\t1`);
      const data = await api.doFormBody('superRedBagDraw');
      if (!self.isSuccess(data)) {
        api.log(data.errMsg);
        if (isContinue) {
          await sleep(4);
          return superRedBagDraw(false);
        }
        return;
      }
      const {data: {shakeLeftTime, prizeDrawVo}} = data;
      if (prizeDrawVo) {
        api.logBoth(`获得 ${prizeDrawVo.amount} ${prizeDrawVo.prizeDesc}`);
      } else {
        api.logBoth(`获得空气`);
      }
      if (shakeLeftTime > 0) {
        await sleep(4);
        return superRedBagDraw();
      }
    }

    // 提现
    async function handleExchange() {
      const prizeData = await api.doFormBody('superRedBagList', {
        'pageNum': 1,
        'pageSize': 20,
        'associateLinkId': '',
        'business': 'superRedEnvelope',
      }, void 0, {
        form: formatPasteData(`body\t{"pageNum":1,"pageSize":20,"linkId":"aE-1vg6_no2csxgXFuv3Kg","associateLinkId":"","business":"superRedEnvelope"}
t\t1718588808759
appid\tactivities_platform
client\tios
clientVersion\t13.1.0
loginType\t2
loginWQBiz\twegame
h5st\t20240617094648772;ii6in6yynt5gm9i1;f2b1d;tk03wa6f21c3c18n8VAbOXAu5Oy7_omzPIWqKPQ9TYfu93H2Op1UxYH5VhzzLmyCeelp5wPmikxX83JB0YHQcMZnB6vT;127854b515bd63c93d7faa2f6c974d33983bd60356125689c806ac254c602d77;4.7;1718588808772;TKmWWU77SPrM7P7ZkH7Pt6mifb50MrYQeAsfO8mRikaao-8cv3UAjqVMC6DAxjrSEDS_UHNEh-5-A_cT8rRBRsMOooyV-Ntr4viJyp-e1lpS6p1WkJRn9f3zLczQ_6X-SxXPxJoWz9Vz3t87-u-rkyB8EIseUn6rhQHp7KP-Vh-RQV6Te7D456ncoUsyEFOCdsoCbc7Cq1J4lSGYYFVBRkReVbyGe_SpfyqTE7O137fCDOd4jdSyzitNA3fn_ub9STqYJWBo8cw6-OOGHKEmMbskbzIi2Bgukq3TmIriXaRfeVEFY56zu7Fjl4ZkPLGM8S6R7L550u5kLx7r4PXptP-dOwHVFNO6oWLdYuOPR_R-P9v1LflBdE4XEXqYkUY91M_Ew4NDnb9VPZGA3fCwNuH2ktqe3KzB7K89QdjAvxWa1hwGxzRNDtBwYXJoTMRJ0YDA
uuid\tc6993893af46e44aa14818543914768cf2509fbf
build\t169370
screen\t390*844
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
lang\tzh_CN
osVersion\t17.5
partner\t-1
cthr\t1`),
      }).then(data => _.get(data, 'data.items', []).find(o => o.prizeType === 4 && o.state === 0));
      if (prizeData) {
        await api.doFormBody('apCashWithDraw', {
          'businessSource': 'NONE',
          'base': {
            'business': 'superRedEnvelope',
            ..._.pick(prizeData, ['id', 'poolBaseId', 'prizeGroupId', 'prizeBaseId', 'prizeType', 'activityId']),
          },
          'channel': '1',
        }).then(data => {
          const amount = _.get(data, 'data.record.amount');
          if (amount) {
            api.log(`正在提现${amount}`);
          } else {
            api.log(data.data);
          }
        });
      }
    }
  }
}

singleRun(SuperRedBagDraw).then();

module.exports = SuperRedBagDraw;
