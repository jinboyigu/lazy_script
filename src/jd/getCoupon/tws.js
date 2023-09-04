const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {sleepTime} = require('../../lib/cron');

class TWS extends Template {
  static scriptName = 'TWS';
  static scriptNameDesc = '店铺领券';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static keepIndependence = true;
  static needInAppComplete1 = true;
  static times = 1;

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        mfreecoupon_tws_getcoupon: {appId: '6d132'},
      },
      signFromSecurity: true,
      removeEncryptKeys: [],
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    await sleepTime(20);
    await doGet();
    await sleep(0.5);
    await doGet();

    async function doGet() {
      // 10点, 20点抢券
      await api.doGetBody('mfreecoupon_tws_getcoupon', {
        'key': 'c0mcc3s4o2a548449b7616440be821ae',
        'roleId': '120266619',
        'to': 'shop.m.jd.com/?shopId=1000001683',
      }, {
        needDelay: false,
        headers: {
          origin: 'https://coupon.m.jd.com',
          referer: 'https://coupon.m.jd.com/',
          'x-referer-page': 'https://coupon.m.jd.com/coupons/show.action',
        },
        qs: {
          appid: 'h5_awake_wxapp',
          client: 'wh5',
          sceneval: 2,
          g_login_type: 1,
          appCode: 'msc588d6d5',
          g_ty: 'ajax',
          'x-api-eid-token': 'jdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKLXVTMNYAAAAADPT7MQNBWDKFWIX',
        },
      }).then(result => {
        api.log(result);
      });
    }
  }
}

singleRun(TWS).then();

module.exports = TWS;
