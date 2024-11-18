const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, getLogs} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');
const {formatPasteData} = require('../../lib/charles');

class PurchaseCard extends Template {
  static scriptName = 'PurchaseCard';
  static scriptNameDesc = '省省卡';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'month_card',
  });
  static needInApp = false;
  static keepIndependence = true;
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://mcard.jd.com',
          'referer': 'https://mcard.jd.com/',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        vvipcocoon_purchaseCard_couponInfo: {appId: 'f173d'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const cardIdEnc = '_vxHkMHQS98=';
    await handleSign();

    async function handleSign(onlyCheckIn = false) {
      const data = await api.doFormBody('vvipcocoon_purchaseCard_couponInfo', {
        cardIdEnc,
        tabCardIdEnc: cardIdEnc,
        'invitorInfo': '',
        'paramData': {'platform': 1, 'pageClickKey': ''},
        'address': '',
        'channel': '314',
        'appVersion': '0',
      });
      !onlyCheckIn && await _sign();
      await _sign1();

      async function _sign() {
        const target = _.get(data, 'data.extraRightsDTO.userRewards', []).find(o => o.status === 2);
        if (!target) return api.log('[每日签到] 今天已经领取或者未开通');
        await api.doFormBody('vvipcocoon_extraRightsDispatch', {
          'receiveKey': target.receiveKey,
          'channel': '314',
          'floorType': 5,
          'address': 'iOmxOgGJp10LNqUffyvPP+lrTLk7YNv0',
        }).then(data => {
          api.log(`[每日签到] ${data.data.materialText} ${data.data.showAmount}`);
        });
      }

      // 额外的打卡领券任务(7天打卡4次)
      async function _sign1() {
        const progressTaskList = _.get(data, 'data.cocoonTaskDTO.progressTaskList', []) || [];
        for (const {
          instanceMainTitle,
          instanceThreshold,
          instanceTotalProgress,
          instanceId,
          signToday,
          instanceStatus,
          rewardList = [],
          rewardStatus
        } of progressTaskList) {
          const rewardData = `(${rewardList.map(o => `${o.couponQuota}-${o.couponDiscount}${o.couponLimitStr}`).join()})`;
          const log = msg => api.log(`[${instanceMainTitle}] ${msg}`);
          if (rewardStatus === 1) {
            await api.doFormBody('vvipcocoon_taskRewardReceive', {
              instanceId,
              'floorType': 6,
              cardIdEnc,
              'receiveKey': rewardList[0].receiveKey,
            }).then(data => {
              if (data.success) {
                log(`领取成功 ${rewardData}`);
                if (_.get(data, 'data.newTask')) {
                  // 继续打卡
                  return handleSign(true);
                }
              } else {
                log(`领取失败 ${JSON.stringify(data)}`);
              }
            });
            break;
          }
          if (!instanceMainTitle.match('打卡') || (instanceThreshold === instanceTotalProgress) || (rewardStatus === 1) || (instanceStatus !== 0)) continue;
          if (signToday) {
            log(`今天已打卡${rewardData}`);
            continue;
          }
          await api.doFormBody('vvipcocoon_taskSign', {
            instanceId,
            'floorType': 6,
            cardIdEnc,
          }).then(data => {
            if (data.success) {
              log(`今日打卡成功${rewardData}`);
            } else {
              log(`打卡失败, ${JSON.stringify(data)}`);
            }
          });
        }
      }
    }
  }
}

singleRun(PurchaseCard).then();

module.exports = PurchaseCard;
