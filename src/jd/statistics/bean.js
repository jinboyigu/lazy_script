const Template = require('../base/template');

const {replaceObjectMethod, sleep, writeFileJSON, singleRun} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

const indexUrl = 'https://wqsh.jd.com/promote/201801/bean/mybean.html';

class StatisticsBean extends Template {
  static scriptName = 'StatisticsBean';
  static scriptNameDesc = '豆豆统计';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({});
  static cookieKeys = ['wq_uin', 'wq_skey'];
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: new URL(indexUrl).origin,
          referer: indexUrl,
        },
        qs: {
          appid: 'jd-cphdeveloper-m',
          loginType: 11,
          g_login_type: 0,
          g_tk: 2433214,
          g_ty: 'ajax',
          appCode: 'msd95910c4',
          body: {
            'tenantCode': 'jgminise',
            'bizModelCode': 6,
            'bizModeClientType': 'WxMiniProgram',
            'externalLoginType': 2,
          },
        },
      },
    };
  }

  static async doMain(api, shareCodes) {
    const self = this;

    const accumulateFn = (accumulator, currentValue) => accumulator + currentValue;

    // 获取用户信息
    const total = await api.doGetBody('queryJDUserInfo').then(data => {
      if (data.retcode !== 0) {
        api.logSignOut();
      }
      return _.get(data, 'base.jdNum');
    });
    // 获取所有列表
    const {list: detailList, willExpireNum} = await api.doGetBody('myBean');
    const prevDate = getMoment().subtract(1, 'days').formatDate();
    const preMount = _.map(detailList.filter(o => o['createDate'].replace(/\//g, '-').match(prevDate)), 'amount')
    .reduce(accumulateFn);
    api.log(`总数: ${total}, 昨天(${prevDate.substring(5)})的收益: ${preMount}, 明天24点将过期的数量: ${willExpireNum}`);
    // TODO 确认具体过期获取
    return;
    // 获取即将过期列表
    const expireList = await api.doGetPath('activep3/singjd/queryexpirejingdou').then(_.property('expirejingdou')) || [];
    if (_.isEmpty(expireList)) return;
    const sevenDayExpire = _.map(expireList, 'expireamount').reduce(accumulateFn);
    const formatExpire = expireList.map(o => `${getMoment(o['time'] * 1000).format('MM-DD')}(${o['expireamount']})`);
    const expireMsg = [
      `最近7天过期统计: ${sevenDayExpire}`,
    ];
    if (sevenDayExpire > 0) {
      expireMsg.push(`具体: ${formatExpire.join(', ')}`);
    }
    api.log(expireMsg.join(', '));
  }
}

singleRun(StatisticsBean).then();

module.exports = StatisticsBean;
