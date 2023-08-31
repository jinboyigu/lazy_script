const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class GetCoupon extends Template {
  static scriptName = 'GetCoupon';
  static scriptNameDesc = '领券';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static keepIndependence = true;
  static times = 1;

  static apiOptions() {
    return {};
  }

  static async beforeRequest(api) {
    const self = this;
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const config = [
      {
        name: '全品券(9-3)',
        get: () => api.doFormBody('newBabelAwardCollection', {
          'activityId': 'hqpMZkENdYWTtVJuYjMugCruDzR',
          'scene': '1',
          'args': 'key=mdaft3edrei4adl0c1m5sb14ef48c677,roleId=117128188',
        }, {
          client: 'wh5',
          clientVersion: '1.0.0',
        }).then(_.property('result.subCodeMsg')),
      },
    ];

    for (const {name, get} of config) {
      await get().then(msg => {
        api.log(`${name} ${msg}`);
      });
    }
  }
}

singleRun(GetCoupon).then();

module.exports = GetCoupon;
