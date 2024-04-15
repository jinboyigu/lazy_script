const EarnCoins = require('./EarnCoins');

const {sleep, writeFileJSON, singleRun} = require('../../lib/common');
const {sleepTime} = require('../../lib/cron');
const {doFormWithClientTime} = require('./api');
const _ = require('lodash');

class EarnCoinsRedeem extends EarnCoins {
  static scriptName = 'EarnCoinsRedeem';
  static scriptNameDesc = '赚金币-兑换红包';

  static apiOptions = {
    options: {
      headers: {
        origin: 'https://gold.jd.com',
      },
      form: {
        appid: 'market-task-h5',
      },
    },
  };

  static async doMain(api) {
    const self = this;

    const apiExecute = (method, data, needDelay) => doFormWithClientTime(api, method, data, {functionId: 'MyAssetsService.execute'}, {needDelay});

    if (self.getNowHour() === 23) {
      // 定时兑换
      api.logBoth('准备 24 点兑换');
      await sleepTime(24);
      await doExchange([{order: 5}, {order: 3}]);
    }
    await handleRedExchange();

    // 兑换红包, 一天只能兑换一次
    async function handleRedExchange() {
      const redEnvelopes = [0, 0.3/*新人专享*/, 3, 5, 240];
      // 要兑换那个就更改下标
      const minRedEnvelopes = redEnvelopes[2];
      if (!minRedEnvelopes) return api.logBoth('请选择正确的参数');
      let {
        isGetCoupon,
        balanceVO,
        gears,
      } = await apiExecute('goldShopPage').then(data => data.data) || {};
      if (isGetCoupon) return api.logBoth('今天已经兑换了, 请明天再来');
      if (!balanceVO) return api.logBoth('接口请求错误');
      gears = gears.reverse().filter(o => {
        const amount = +o['amount'];
        return amount >= minRedEnvelopes && o['status'] === 1 && +balanceVO['estimatedAmount'] >= amount;
      });
      if (_.isEmpty(gears)) return api.logBoth(`没有找到要替换的红包, 请进行修正参数`);
      api.logBoth(JSON.stringify(gears));
      await doExchange(gears);
    }

    async function doExchange(gears) {
      for (const gear of gears) {
        const {order: hongBaoOrder, type} = gear;
        const stop = await apiExecute('cashOutBySendHongBao', {hongBaoOrder, type: 1}, false).then(data => {
          const success = self.isSuccess(data);
          if (success) {
            api.logBoth(`兑换 ${hongBaoOrder} 红包成功`);
          }
          return success;
        });
        if (stop) {
          break;
        }
      }
    }

    // TODO 兑换商品, 待完善
    // async function handleProduceExchange() {
    //   await doFormBody(api, 'ProductExchangeService', 'productList', {pageNum: 1, pageSize: 10});
    // }
  }
}

singleRun(EarnCoinsRedeem).then();

module.exports = EarnCoinsRedeem;
