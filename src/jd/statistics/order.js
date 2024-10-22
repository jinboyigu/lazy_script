const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const consoletable = require('@xdooi/consoletable');
const fs = require('fs');

class StatisticsOrder extends Template {
  static scriptName = 'StatisticsOrder';
  static scriptNameDesc = '统计订单信息';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    sdkVersion: '3.6.3',
    osVersion: 'iOS 17.5',
    clientType: 'wxapp',
    client: 'ios',
    clientVersion: '8.0.52',
    loginType: 11,
    loginWQBiz: 'golden-trade',
    appid: 'new_order',
    xAPIScval2: 'wx',
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;
  static cookieKeys = ['wq_uin', 'wq_skey'];

  static apiOptions() {
    return {
      options: {
        headers: {
          referer: 'https://servicewechat.com/wx91d27dbf599dff74/769/page-frame.html',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.52(0x18003426) NetType/WIFI Language/zh_CN',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        common_order_list: {appId: '2d275'},
      },
      algoOptions: {
        type: 'wechat',
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    const startDay = _.get(self._command, 0) || '2024-10-13';
    const endDay = _.get(self._command, 1) || getMoment().add(1, 'd').format('YYYY-MM-DD');

    await self.beforeRequest(api);
    const allOrderList = [];
    for (let i = 1; i < 10; i++) {
      const result = await getList(i, 50);
      const orderList = _.get(result, 'body.orderList', []);
      const validList = orderList.filter(o => getMoment(o.submitDate).isAfter(startDay) && getMoment(o.submitDate).isBefore(endDay)).filter(o => !/支付抽奖权益包|省钱包|京东省省卡|商家赠|开方服务|咨询服务|京东E卡|180天只换不修|话费充值|全额返超值权益包/.test(o.wareInfoList[0].wareName));
      if (_.isEmpty(validList)) break;
      allOrderList.push(...validList);
      if (orderList.some(o => getMoment(o.submitDate).isBefore(startDay))) break;
      await sleep(2);
    }

    // 处理数据和输出
    const waitPayList = _.sortBy(allOrderList.filter(o => o.orderStatusInfo.originOrderStatus === 1), 'submitDate');
    const paidList = _.sortBy(allOrderList.filter(o => o.orderStatusInfo.originOrderStatus > 1), 'submitDate');
    const formatList = list => list.map(({wareInfoList, submitDate, shouldPay}) => [
      wareInfoList.map(o => `${o.wareName}(${o.num} 件)`).join('\n'),
      wareInfoList.map(o => `https://item.m.jd.com/product/${o.skuId}`).join('\n'),
      submitDate,
      shouldPay,
    ]);
    // TODO 按需开启日志输出
    0 && api.log(['----等待付款----', ...waitPayList, '----已付款----', ...paidList]
    .map(o => _.isString(o) ? o : `商品名: ${o.wareInfoList.map(o => `${o.wareName}(${o.num} 件)`).join(', ')}, ${o.shouldPayTip}: ${o.shouldPay}, 下单时间: ${o.submitDate}`)
    .join('\n'));

    const drawTable = (list, paid = false) => {
      api.clog(`----${paid ? '已付款' : '等待付款'}----`);
      consoletable.drawTable([
        {
          index: '序号',
          name: '商品名(件数)',
          link: '购买链接',
          time: '下单时间',
          price: paid ? '实付' : '应付',
        },
        ...formatList(list).map((array, i) => [i + 1, ...array]),
      ], {head: 'def'});
    };
    drawTable(waitPayList);
    drawTable(paidList, true);
    const filePath = require('path').resolve(__dirname, `order_${startDay}_${getMoment().format('YYYY-MM-DD')}.csv`);
    // 复制到 wps 前可能需要手动到浏览器用 copy 成纯文本
    const data = formatList(paidList).map(array => [...array.map(s => `"${s}"`), '京东', api.pinLabel].join('\t')).join('\n');
    const first = api.isFirst;
    fs.writeFileSync(filePath, `${data}${first ? '\n' : ''}`, {flag: first ? 'w' : 'a'});


    function getList(page = 1, pageSize = 10) {
      return api.doGetBody('common_order_list', {
        'externalLoginType': 1,
        'appType': '1',
        'bizType': '2',
        'source': '-1',
        'token': '',
        'deviceUUId': '',
        'platform': 2,
        'uuid': '66489454451071729268909745',
        'systemBaseInfo': {'SDKVersion': '3.6.3', 'hostVersionName': '8.0.52', 'system': 'iOS 17.5'},
        'appVersion': '1.0.0',
        'orderListTag': '4096',
        page,
        pageSize,
        'oldAgeStyle': '0',
      });
    }
  }
}

singleRun(StatisticsOrder).then();

module.exports = StatisticsOrder;
