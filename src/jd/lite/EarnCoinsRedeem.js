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
      await handleRedExchange(24);
    }
    await handleRedExchange();

    // 兑换红包, 一天只能兑换一次
    async function handleRedExchange(cronHour) {
      const redEnvelopes = [0, 0.3/*新人专享*/, 3, 5, 8, 20, 240];
      // 要兑换那个就更改下标
      const minRedEnvelopes = redEnvelopes[2];
      if (!minRedEnvelopes) return api.logBoth('请选择正确的参数');
      let {
        isGetCoupon,
        balanceVO,
        gears,
      } = await apiExecute('goldShopPage').then(data => data.data) || {};
      if (!cronHour) {
        if (isGetCoupon) return api.logBoth('今天已经兑换了, 请明天再来');
        if (!balanceVO) return api.logBoth('接口请求错误');
      }
      gears = gears.reverse().filter(o => {
        const amount = +o['amount'];
        const enable = amount >= minRedEnvelopes && +balanceVO['estimatedAmount'] >= amount;
        if (cronHour) {
          return enable;
        }
        return enable && o['status'] === 1;
      });
      if (_.isEmpty(gears)) {
        return api.logBoth('金额不足, 无法进行兑换');
      } else if (cronHour) {
        api.logBoth(`准备 ${cronHour} 点兑换`);
        await sleepTime(cronHour);
      }
      await doExchange(gears);
    }

    async function doExchange(gears) {
      for (const gear of gears) {
        const {order: hongBaoOrder, type} = gear;
        const stop = await apiExecute('cashOutBySendHongBao', {hongBaoOrder, type: 1}, false).then(data => {
          const success = self.isSuccess(data);
          if (success) {
            api.logBoth(`兑换 ${_.get(data, 'data.amount')} 红包成功`);
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
