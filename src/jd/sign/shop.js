const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, parallelRun, printLog, replaceObjectMethod} = require('../../lib/common');
const {sleepTime} = require('../../lib/cron');
const _ = require('lodash');
const {processInAC} = require('../../lib/env');
const {genParamsSign, convertHex} = require('../../lib/security');
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
        const {h5st} = await shopSignS.sign({functionId, t, appid, body: convertHex(body)});
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
      '0C174CB952B4E22C22E744FE32FB48BA',
      '180686F6F6EB1419C9CF0E4AD6A818C0',
      '5380D8125D8D98A1B0C19B8FC469ED79',
      '90732178E5D3FF4731EC332042CC8416',
      '1A4B4B0AFB6594B2C453FC7558D58435',
      '47BB15B1D4AD4B527B7D242DC6C6A8E6',
      'C7BDE4A74E24395776C27F0EB8BB4B1E',
      '139427C1FC4A7AC61625578B3D7815F0',
      '6BEA327B7DC62887EB31D36D04A27EA0',
      'D8DB84AC8C869CB68D391AF1410A175D',
      'AD768D49383E022523484497A8AFC65B',
      'D6F33209D4269ED2964F51D9E85C9882',
      'BAF481694F3719CAF7706EE901F7EE69',
      'F2A0219C5AF30018B148FE3CF88B5F08',
      'DF9BA2BB3A68E5495557C70F83226115',
      'F94740274BF6525048E0D8567608183C',
      '16194ADD93278D300407B77CC758D36D',
      '56CE7148C0BC0FA290C1381BF2C30815',
      '5BB1D49E0FD5A5F849C762D14E66D94F',
      '4BE027C0D979F3E235B544F6EF59848A',
      '3979CD3259E75343E2F3CFCE8BA65725',
      '6D4E9E9226058C9D3A85BEE1F136DD83',
      '8B78E1E94E985A7AA8611093B07C2878',
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
