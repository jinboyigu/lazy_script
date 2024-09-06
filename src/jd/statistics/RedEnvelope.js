const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const _ = require('lodash');
const {getMoment, getNowDate} = require('../../lib/moment');
const {processInAC} = require('../../lib/env');

class StatisticsRedEnvelope extends Template {
  static scriptName = 'StatisticsRedEnvelope';
  static scriptNameDesc = '红包统计';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static needInApp = false;
  static times = 1;

  static async doMain(api, shareCodes) {
    const self = this;

    const getRedInfo = () =>
      api.doGetBody('redPacket', {
        'type': 1,
        'redBalanceFlag': 1,
        'page': 1,
        'tenantCode': 'jgm',
        'bizModelCode': '6',
        'bizModeClientType': 'M',
        'externalLoginType': '1',
      }, {
        qs: {
          appid: 'jd-cphdeveloper-m',
          loginType: 2,
          client: 'm',
          sceneval: '2',
          g_login_type: '1',
          g_ty: 'ajax',
          appCode: 'ms0ca95114',
        },
        headers: {
          origin: 'https://wqs.jd.com',
          referer: 'https://wqs.jd.com/',
        },
      }).then(data => {
        if (data.code !== '0') {
          api.logSignOut(!processInAC());
        }
        return data;
      });

    let redList = _.get(await getRedInfo(), 'result.redList', []);
    const redSorted = {
      jdApplet: {
        limitName: /京东购物小程序|京东商城/,
        label: '京东购物小程序',
      },
      jd: {
        limitName: '京东商城',
      },
      jx: {
        limitName: '京喜',
      },
      lite: {
        limitName: '京东特价版',
      },
      noLimit: {
        limitName: '',
      },
    };
    const getExpireTime = (day = 1) => {
      const nowMoment = getMoment();
      nowMoment.add(day, 'day');
      return nowMoment.set({
        h: 0,
        m: 0,
        s: 0,
        millisecond: 0,
      }).valueOf();
    };
    const sumRedList = list => formatNumber(_.sum(list.map(o => +o['balance'])) || 0);

    for (let i = 1; i < 6; i++) {
      await calculate(i);
    }

    _.forEach(redSorted, ({msgs}, key) => {
      if (_.isEmpty(msgs)) return;
      api.log(msgs.map(v => _.isString(v) ? v : v.format()).join(', '));
    });

    async function calculate(day) {
      Object.values(redSorted).forEach(o => {
        const {limitName, msgs = []} = o;
        const targetReds = redList.filter(({beginTime}) => beginTime < getMoment().valueOf()).filter(({orgLimitStr}) => limitName ? orgLimitStr.match(limitName) : !orgLimitStr);
        const number = sumRedList(targetReds);
        const expireReds = targetReds.filter(o => o['endTime'] < getExpireTime(day));
        const expire = sumRedList(expireReds);
        _.assign(o, {number, expire, msgs});
      });
      const {noLimit: {number: noLimitNumber, expire: noLimitExpire}} = redSorted;

      for (const [key, object] of Object.entries(redSorted)) {
        const {limitName, number, expire, msgs, label} = object;
        if (['jd', 'lite', 'jx', 'noLimit'].includes(key)) continue;
        const name = limitName ? `${label || limitName}` : '无限制';
        const needSum = key !== 'noLimit';
        if (_.isEmpty(msgs)) {
          msgs.push(`${name}: ${format(number, noLimitNumber, needSum)}`);
        }
        const expireDay = getMoment().add(day - 1, 'day').format('MM-DD');
        const expireNum = format(expire, noLimitExpire, needSum);
        if (_.get(_.last(msgs), 'expireNum') === expireNum) {
          continue;
        }
        msgs.push({
          expireDay,
          expireNum,
          format() {
            return `${this.expireDay}过期: ${this.expireNum}`;
          },
        });
      }
    }

    function format(a, b, needSum = true) {
      return needSum ? `${formatNumber(a + b)}` : a;
    }
  }
}

function formatNumber(num) {
  return +(num.toFixed(2));
}

singleRun(StatisticsRedEnvelope).then();

module.exports = StatisticsRedEnvelope;
