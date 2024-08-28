const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod, matchMiddle} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class SecKillView extends Template {
  static scriptName = 'SecKillView';
  static scriptNameDesc = '浏览得豆';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appid: 'signed_wh5_ihub',
  });
  static keepIndependence = true;
  static times = 1;
  static needOriginProMd = true;
  static needInApp = false;

  static apiOptions() {
    return {
      options: {
        headers: {
          'user-agent': 'jdapp;iPhone;13.1.1;;;M/5.0;appBuild/169381;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22YzY5EJC4EJDrZtG2ZJG0YWOnDNqnENU0CzunDNc2EQDwCtUmEWZsZq%3D%3D%22%2C%22sv%22%3A%22CJckDG%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1719814295%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
        },
      },
    };
  }

  static isSuccess(data) {
    return _.property('code')(data) === '0';
  };

  static async beforeRequest(api) {
    const self = this;

    self.injectEncryptH5st(api, {
      config: {
        seckillViewTask: {appId: '8f7ef'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    let skuIds = [void 0];


    const urls = [
      'https://pro.m.jd.com/mall/active/Md9FMi1pJXg2q7qc8CmE9FNYDS4/index.html?stath=47&navh=44&has_native=0&babelChannel=ttt8&commontitle=no&transparent=1&copSource=miaosha&preventPV=1&forceCurrentView=1',
      'https://pro.m.jd.com/mall/active/43mNbs4F53FUMVin65VHVYYKB94f/index.html?stath=47&navh=44&babelChannel=ttt1&tttparams=bIyZ2TiIAeyJnTGF0IjoiMjIuOTQyOTA2Iiwic2NhbGUiOiIzIiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwid2lkdGgiOiIxMTcwIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMC4wMDAwMDAiLCJwb3NMYXQiOiIyMi45NDI5MDYiLCJwb3NMbmciOiIxMTMuNDc0ODAxIiwiZ3BzX2FyZWEiOiIwXzBfMF8wIiwibG5nIjoiMC4wMDAwMDAiLCJ1ZW1wcyI6IjAtMC0wIiwiZ0xuZyI6IjExMy40NzQ4MDEiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn90%3D',
    ];

    for (const url of urls) {
      await updateSkuIds(url);
    }

    async function updateSkuIds(url) {
      const result = await api.doGetUrl(url).then(data => {
        const matches = data.match(/"skuId":"\d*"/g);
        if (!matches) {
          console.log(data);
        }
        return _.uniq((matches || []).map(str => str.replace('"skuId":"', '').replace(/"$/, '')));
      });
      skuIds = skuIds.concat(result);
    }

    for (const skuId of skuIds) {
      const stop = await seckillViewTask(skuId);
      if (stop) break;
      await sleep(2);
    }

    async function seckillViewTask(skuId) {
      let {
        taskProgress,
        taskThreshold,
        awardStatus,
      } = await api.doFormBody('seckillViewTask', {skuId, taskType: skuId ? 1 : 0}).then(_.property('data'));
      if (awardStatus) {
        api.logBoth('今天已经完成, 请明天再来!');
        return true;
      }
      if (taskProgress > 0 && (taskProgress === taskThreshold) && !awardStatus) {
        await api.doFormBody('seckillViewTask', {taskType: 2}).then(data => {
          if (self.isSuccess(data)) {
            api.log(`成功获取豆豆 ${_.get(data, 'data.beanNum')}`);
          } else {
            api.log(data.errorMessage);
          }
        });
        return true;
      }
    }
  }
}

singleRun(SecKillView).then();

module.exports = SecKillView;
