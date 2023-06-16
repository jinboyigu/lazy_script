const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, parallelRun, printLog, replaceObjectMethod} = require('../../lib/common');
const {sleepTime} = require('../../lib/cron');
const _ = require('lodash');
const {processInAC} = require('../../lib/env');
const {genParamsSign} = require('../../lib/security');
const {getMoment} = require('../../lib/moment');
const appid = 'interCenter_shopSign';

class SignShop extends Template {
  static scriptName = 'SignShop';
  static scriptNameDesc = '店铺签到(web)';
  static needOriginH5 = true;
  static needInAppComplete = true;
  static times = 1;
  static concurrent = true;
  static concurrentOnceDelay = 0;
  static dirname = __dirname;

  static apiOptions = {
    options: {
      uri: 'https://api.m.jd.com/api',
      qs: {
        loginType: 2,
        appid,
      },
    },
  };

  static isSuccess(data) {
    return _.property('code')(data) === 200;
  }

  static async doMain(api) {
    const self = this;

    const shopSignS = genParamsSign({userAgent: api.options.headers['user-agent'], appId: '4da33'/*, fp: '5975779562801414'*/});
    replaceObjectMethod(api, 'doGetBody', async ([functionId, body, options]) => {
      const t = getMoment().valueOf();
      if (['interact_center_shopSign_getActivityInfo', 'interact_center_shopSign_signCollectGift'].includes(functionId)) {
        const {h5st} = await shopSignS.sign({functionId, t, appid, body});
        options = options || {};
        _.assign(options, {qs: {h5st, t}});
      }
      return [functionId, body, options];
    });
    // 签到页面url
    // https://h5.m.jd.com/babelDiy/Zeus/2PAAf74aG3D61qvfKUM5dxUssJQ9/index.html?token=

    // 默认 tokens
    const defaultShopInfos = [];

    let signSucceedTokens = [];

    // token, venderId, id
    let shopInfos = [
      '4C4F8E1311332AC48BF169B6F2169C6A',
      '9F8C70F16BFEF3A9549565ADD7FF58B9',
      'B04E90D96040E84CC2CD4906DB378CF4',
      '954794B393FEABCFC65C2ABF90A423CB',
      'F77BF0EE113A69AD5D69C04A36D49F94',
      'A3FAF095AF4093E52E01D753FD9A1D57',
      '9935CC2D633C171A5A47E5D3D7B3354D',
      '808D68FE15A38513D4E1F129F6049E58',
      '1C9D89328A595CC40372994301972DC4',
      '3D65E51AA21FDCB5431AA4A976970F5C',
      'F6B3E4E9A5C1CD6371135B1C799923A3',
      '53A748A9A5DAF2158E85329B8520E5DE',
      '2A9D8C4A3472E4F97BCBB43840F64735',
      '16FF66123FE6343FC65A150146FE682E',
      '5965C8BDAE40472AF0E29BAC09A2A5E9',
      '567D4AA74E340AA395499CFED1FCC9E2',
      '766DFFF41BA4B3CA3EF5C3B07D91C5D8',
      '88887FFC5B19B4469F99D450291EC644',
      // 脚本新增插入位置
    ].concat(defaultShopInfos);

    if (_.isEmpty(shopInfos)) {
      return api.log('当前没可用的shop info');
    }

    const nowHour = self.getNowHour();
    if (nowHour !== 23 || _.get(self._command, 0)) {
      await updateShopInfos(false);
      return handleSign();
    }

    await updateShopInfos();
    await sleepTime(24);
    await handleSign();

    async function handleSign(listInfo = false) {
      // token, venderId, id
      const list = shopInfos.filter(item => !signSucceedTokens.includes(_.head(_.concat(item))));

      await parallelRun({
        list,
        runFn: v => (listInfo ? handleListShopInfo : doSign)(...[].concat(v)),
        onceNumber: 1,
        onceDelaySecond: 1,
      });
    }

    // 补全shopInfos
    async function updateShopInfos(addOtherInfo = true) {
      shopInfos = shopInfos.map(v => _.concat(v));
      // 同时请求的情况下接口做了限制
      // {"code":"-1","echo":"com.jd.jsf.gd.error.RpcException: [JSF-22211]Invocation of com.jd.interact.center.client.api.color.service.read.ShopSignActivityReadService.getActivityInfo of app: is over invoke limit:[20], please wait next period or add upper limit."}
      await sleep(api.currentCookieTimes * 2 * shopInfos.length);
      for (let shopInfo of shopInfos) {
        if (shopInfo.length !== 1) continue;
        const token = shopInfo[0];
        await sleep(2);
        await getActivityInfo(token).then(async data => {
          if (!self.isSuccess(data)) {
            logShopSignInfo(`${token}: 402 已经失效`);
            return shopInfo.pop();
          }
          const notSign = await handleListShopInfo(token);
          if (notSign) return shopInfo.pop();
          if (!addOtherInfo) return;
          shopInfo.push(data.data.venderId);
          shopInfo.push(data.data.id);
        });
      }
      shopInfos = shopInfos.filter(v => !_.isEmpty(v));
    }

    async function handleListShopInfo(token) {
      const currentSignDays = await api.doGetBody('interact_center_shopSign_getSignRecord', {token}).then(data => _.property('data.days')(data));
      return getActivityInfo(token).then(data => {
        if (!self.isSuccess(data)) return;
        // TODO 待修正每日签到是否有获得的逻辑
        const allPrizeRuleList = _.concat(_.property('data.prizeRuleList')(data), _.property('data.continuePrizeRuleList')(data));
        const prizeTypes = {
          4: '豆',
          10: 'E卡(元)',
          14: '红包(分)',
        };
        const prizeRules = allPrizeRuleList.map(({prizeList, days, userPrizeRuleStatus}) => {
          if (userPrizeRuleStatus === 2) return '';
          return _.filter(prizeList.map(({type, discount, userPirzeStatus}) => {
            if (!Object.keys(prizeTypes).map(v => +v).includes(type) || userPirzeStatus !== 1) return '';
            return `${days ? days : '每'}天${Math.floor(discount)}${prizeTypes[type]}`;
          })).join();
        }).filter(str => str);
        const notPrize = defaultShopInfos.includes(token) ? false : _.isEmpty(prizeRules);
        const prizeRuleMsg = notPrize ? '' : `奖品: ${prizeRules.join(', ') || '积分/其他必需值'}`;
        const logMsg = _.filter([`${token} 已签到${currentSignDays}天`, prizeRuleMsg]).join(', ');
        logShopSignInfo(logMsg);
        return notPrize;
      });
    }

    function logShopSignInfo(msg) {
      api.log(msg);
      if (!processInAC()) {
        api.log(msg, self.getFilePath('shop.log'));
      }
    }

    async function doSign(token, venderId, id) {
      if (venderId) {
        return signCollectGift(venderId, id, token);
      }
      // 该逻辑不适用于0点签到, 仅做补缺
      return getActivityInfo(token).then(data => {
        if (!self.isSuccess(data)) {
          return api.log(`${token}: ${data.msg}`);
        }
        if (_.property('data.userActivityStatus')(data) === 2) {
          return api.log(`${token}: 已经签到`);
        }
        return signCollectGift(data.data.venderId, data.data.id, token);
      });
    }

    // 获取店铺信息
    async function getActivityInfo(token) {
      return api.doGetBody('interact_center_shopSign_getActivityInfo', {token});
    }

    // 签到
    async function signCollectGift(venderId, activityId, name) {
      let allMsg = [name || vernderId];
      return api.doGetBody('interact_center_shopSign_signCollectGift', {
        venderId,
        activityId,
      }, {needDelay: false}).then(data => {
        if (self.isSuccess(data)) {
          signSucceedTokens.push(name);
          allMsg.push('签到成功');
        } else {
          allMsg.push(data.msg);
        }
        api.log(allMsg.join(': '));
        return data;
      });
    }
  }
}

singleRun(SignShop).then();

module.exports = SignShop;
