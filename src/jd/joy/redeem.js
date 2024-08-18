const Joy = require('./index');
const {sleepTime} = require('../../lib/cron');
const {sleep, singleRun} = require('../../lib/common');

const targetGiftValue = 450;

class JoyRedeem extends Joy {
  static scriptName = 'JoyRedeem';
  static scriptNameDesc = '宠汪汪-换豆豆';
  static times = 1;
  static concurrent = true;
  static loopHours = [23, 7, 15];

  static async doMain(api) {
    const self = this;
    const doPostBody = (functionId, body, options) => api.doGetBody(functionId, body, {...options, method: 'POST'});

    await self.beforeRequest(api);
    const {petCoin, beanConfigs} = await doPostBody('petEnterRoom').then(_.property('data'));
    const beanHours = self.loopHours.map(hour => hour + 1);
    const targetHour = self.getNowHour() + 1;
    if (!beanHours.includes(targetHour)) return api.log(`当前时间不在兑换范围内`);
    const beanInfos = await getBeanInfos(targetHour, beanConfigs);
    if (beanInfos.find(o => o['giftValue'] === targetGiftValue).salePrice > petCoin) {
      return api.log('当前积分不足, 无法兑换');
    }
    api.logBoth(`准备${targetHour}点进行兑换`);
    await sleepTime([targetHour - 1, 58]);
    // 进行验证
    await api.doGetBody('getH5Friends');
    await sleepTime(targetHour);
    api.log('开始兑换');
    await handleExchange();

    async function getBeanInfos(targetHour, beanConfigs) {
      if (targetHour === 24) targetHour = 0;
      return beanConfigs[`beanConfigs${targetHour}`] || [{
        'id': 343,
        'giftId': 562,
        'giftName': `${targetGiftValue}京豆`,
        'giftType': 'jd_bean',
        'giftValue': targetGiftValue,
        'salePrice': 8000,
      }];
    }

    // 兑换豆豆
    async function handleExchange() {
      if (!beanInfos) return;
      for (const beanInfo of beanInfos) {
        await doExChange(beanInfo);
      }
    }

    async function doExChange(beanInfo, loop = true) {
      const {id, leftStock, giftValue, giftName, salePrice} = beanInfo;
      // 只兑换 @giftValue
      if (/*leftStock === 0 || */giftValue !== targetGiftValue || petCoin < salePrice) return;
      const body = {
        'buyParam': {
          'orderSource': 'pet',
          'saleInfoId': id,
        },
        'deviceInfo': {
          'eid': 'M7UO6SRTFR5GQS7SPKPOGT7ZZB6KH2I7CUXZGVFSPJ5773VII5RHNSVRM4FK4RSLDCBRG3QQUS4WNC5PZ2767E6D3Q',
          'fp': 'a82f3737c41bc4da5f7b148bf57f5d78',
          'deviceType': '',
          'macAddress': '',
          'imei': '',
          'os': '',
          'osVersion': '',
          'ip': '',
          'appId': '',
          'openUUID': '',
          'idfa': '',
          'uuid': '',
          'clientVersion': '',
          'networkType': '',
          'appType': '',
          'sdkToken': 'jdd01VH4DYT6IXKM6GYREFO4PXKXBDXWJEHZVIV3LDQRWBVVDNRI4FQAC5XTHXSE7QFYCNEPAWB335ZG44NJF6VZEC23UERLC4GGCNZTZMAY01234567',
        },
        'source': 'jdapp',
      };
      await doPostBody('giftNewExchange', body, {
        needDelay: false,
      }).then(async data => {
        const errorCode = data['errorCode'];
        api.log(`${giftName} 兑换结果: ${errorCode}`);
        if (errorCode === 'buy_success' || !loop) return;
        await sleep();
        await doExChange(beanInfo, false);
      });
    }
  }
}

singleRun(JoyRedeem, ['start', 'loop'], async (method, getCookieData) => {
  if (method === 'start') {
    return start();
  }
  if (method === 'loop') {
    return JoyRedeem.loopRun(start);
  }

  async function start() {
    return JoyRedeem.start(getCookieData());
  }
}).then();

module.exports = JoyRedeem;
