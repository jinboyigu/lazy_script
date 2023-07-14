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
      '8FE6B2B73AFCAA2F741A87090B755428',
      '3756A1C3E882FD88D6D86F38B51FD303',
      'CA8F38BC462AD12AD59F7413BD3D5A14',
      'BCEC9E8F8A80CD17BDEB66AAB1E4AF0B',
      'A139C4F01E6C4CBBF12E4C653B4953DE',
      'E0E992C174F391EE190A734A21047137',
      '47874645D64A06BECA65D5A9C9FB7F44',
      '7481598E07E5FF6D83CEF87CBA0AE6BF',
      'DFC82A19B5CF53ADF6F59149763A01EF',
      'B0CC6A6D81C48924A517F343D77A941D',
      'B6BE4217D6349703EC385C879DC2E277',
      '1E96EB2705E58B5ABB2E5D6CCF025F95',
      'B2E27A701BB16A079F0AA715434546EF',
      'E4440CF19C0B58715BB8A20000E5B3AA',
      'ABD4FF20106EC0DEA21292467C3EEA44',
      '734B9C87215D3E3B14F83BFFCD7498F4',
      'E5E4E59BF60665896BDC6AEF3E242F6B',
      'F20008F339F6F922A1D518F7383007FE',
      '8E7D94BCB0016A29E0A3DDAB0143C2C3',
      '93E76638942E1B9C0B50974BFB63498E',
      'BD80EAE5FA64B8E70D4DB6E9AF54F083',
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
        onceNumber: 5,
        onceDelaySecond: 1,
      });
    }

    // 补全shopInfos
    async function updateShopInfos(addOtherInfo = true) {
      shopInfos = shopInfos.map(v => _.concat(v));
      // 同时请求的情况下接口做了限制
      // {"code":"-1","echo":"com.jd.jsf.gd.error.RpcException: [JSF-22211]Invocation of com.jd.interact.center.client.api.color.service.read.ShopSignActivityReadService.getActivityInfo of app: is over invoke limit:[20], please wait next period or add upper limit."}
      // await sleep(api.currentCookieTimes * 2 * shopInfos.length);
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
