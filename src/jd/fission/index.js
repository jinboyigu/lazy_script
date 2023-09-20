const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class Fission extends Template {
  static scriptName = 'Fission';
  static scriptNameDesc = '转赚红包';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static linkId = '3orGfh1YkwNLksxOcN8zWQ';
  static commonParamFn = () => ({
    body: {linkId: this.linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '12.1.0',
    'x-api-eid-token': 'jdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKU5UZIFAAAAAACM2ILZWELTYIAAX',
  });
  static keepIndependence = true;
  static needInApp = false;

  static apiOptions() {
    return {
      options: {
        headers: {
          'user-agent': 'jdapp;iPhone;12.1.0;;;M/5.0;appBuild/168858;jdSupportDarkMode/0;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22YzY5EJC4EJDrZtG2ZJG0YWOnDNqnENU0CzunDNc2EQDwCtUmEWZsZq%3D%3D%22%2C%22sv%22%3A%22CJYkDq%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1695025941%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
          origin: 'https://pro.m.jd.com',
          'x-referer-page': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html',
          'referer': 'https://pro.m.jd.com/mall/active/3BwUqhLsJYrHP4qgAgDDJGrSVngK/index.html?from=kouling&channelType=1&activityChannel=jdapp&femobile=femobile&tttparams=WIFszeyJnTGF0IjoiMjIuOTQzMTA1IiwidW5fYXJlYSI6IjE5XzE2MDFfMzY5NTNfNTA0MDAiLCJkTGF0IjoiIiwicHJzdGF0ZSI6IjAiLCJhZGRyZXNzSWQiOiI1MTU2MDkwNDExIiwibGF0IjoiMjMuMDc0MTIxIiwicG9zTGF0IjoiMjIuOTQzMTA1IiwicG9zTG5nIjoiMTEzLjQ3NDcxOCIsImdwc19hcmVhIjoiMF8wXzBfMCIsImxuZyI6IjExMy40MjM3MjAiLCJ1ZW1wcyI6IjItMC0yIiwiZ0xuZyI6IjExMy40NzQ3MTgiLCJtb2RlbCI6ImlQaG9uZTEzLDMiLCJkTG5nIjoiIn50%3D&originId=3orGfh1YkwNLksxOcN8zWQ&inviteCode=voN1y2F4JuplvN6EKiBjFe4a8n6-2Gg_7sca7-HKNDg&inviterId=CeymEOdTGnhBzMjmwC12IA',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        wheelsHome: {appId: 'c06b7'},
        // inviteFissionBeforeHome: {appId: '02f8d'},
        inviteFissionHome: {appId: 'eb67b'},
        // inviteFissionDrawPrize: {appId: 'c02c6'},
        apCashWithDraw: {appId: '8c6ae'},
      },
      signFromSecurity: true,
    });
  }

  static charlesFrom = {
    inviteFissionDrawPrize: `body\t{"linkId":"3orGfh1YkwNLksxOcN8zWQ"}
t\t1695027543761
appid\tactivities_platform
client\tios
clientVersion\t12.1.0
h5st\t20230918165903778;z6z66zzznm35ti00;c02c6;tk03wa3541cfe18nW1rWE7c2VbDuC7HNnJR0qO3kmRTxFFqYSFemsi4Di7aYkp_AFWxsnVvngVuX7kPxg_UrNVWqWVDo;4ae8c39f05bd5f376d278b5cd67bf4cf;4.1;1695027543778;5f7a486ba29fbc5d176654e46394ec5e0bd88693c61e67c8c7fe08d7d4a9d65657c2cd8d66ddd0104f70ee0a2d3f6a7b4fa36f462043e7f27a7b0dd4de3193de37a447c8f9f2ec43fb247e391851408a399f2b593e94ea1c863a768e208458e7154ba0704f6c18a671688b546ae9f1b0e6454b1383c4cca6dd110c58091a5fa69829a78f9fb73807af333af01fa8ebf91dc41f22ef3b70374611ba0f4e39b473f1f44d67fa73c11ab8a0dbe5584926cc9d533d7524a048138e82d416fbd518191f17159a8fc308f9730e1831c505b270ce7f6484a3f7222a8d3441ed548e1c7f529fb8ccf270d333ee4f7af7df1f003ca4a3f7c479957da57da38d715375aefc
x-api-eid-token\tjdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKU53DROAAAAAACSW6YKVVZD6OKQX
uuid\tc6993893af46e44aa14818543914768cf2509fbf
build\t168858
screen\t390*844
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
lang\tzh_CN
osVersion\t16.6
partner\t-1
cthr\t1`,
    // TODO 容易活动火爆
    inviteFissionBeforeHome: `body\t{"linkId":"3orGfh1YkwNLksxOcN8zWQ","isJdApp":true,"inviter":"CeymEOdTGnhBzMjmwC12IA"}
t\t1695025941943
appid\tactivities_platform
client\tios
clientVersion\t12.1.0
h5st\t20230918163222325;g9tn53zmmii6i6h8;02f8d;tk03wc7f81c7418nyVdjneezpzTM9e7FbjcP42Rbf--GHveo1cegD9XaUgYTgRckXN4KQXx7YJJkdv5Bbul0zTPUHZ6R;efc7772382367a4b2b3c92789e4b0aec;4.1;1695025942325;5f7a486ba29fbc5d176654e46394ec5e0bd88693c61e67c8c7fe08d7d4a9d65657c2cd8d66ddd0104f70ee0a2d3f6a7b4fa36f462043e7f27a7b0dd4de3193de37a447c8f9f2ec43fb247e391851408a399f2b593e94ea1c863a768e208458e7154ba0704f6c18a671688b546ae9f1b0e6454b1383c4cca6dd110c58091a5fa69829a78f9fb73807af333af01fa8ebf91dc41f22ef3b70374611ba0f4e39b473f1f44d67fa73c11ab8a0dbe5584926ccd2a408866d68515f79618e0b11e73b85d340d50ff418e5e9b9e9beeef16b5feccc3c344e410d69c9292de55b0d9b2bc58b8a9cdd4f8e039e5d3b698d18d82c303b68bd324f16c4f94ff73e6fec7b0013
x-api-eid-token\tjdd03ZPNNW3TV6YVBDF6LALDR2XZXJIOXG7DOZCOE5KWDM52NKDQPTVI2DNJBTLINK7PEB5D6KDHQSFP3ME3ELYDTW3PZHQAAAAMKU5UZIFAAAAAACM2ILZWELTYIAAX
uuid\t-1
build\t-1
screen\t390*844
networkType\t-1
d_brand\t-1
d_model\t-1
lang\tzh_CN
osVersion\t-1
partner\t-1
cthr\t1`,
  };

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    if (self.isFirstLoop()) {
      await handleDoShare();
    }
    const {data: {inviter, inviteCode, prizeNum}} = await api.doFormBody('inviteFissionHome');

    for (let i = 0; i < prizeNum; i++) {
      const result = await doFormBodyFromCharles('inviteFissionDrawPrize');
      await sleep(5);
      if (!_.get(result, 'success')) continue;
      const {data} = result;
      const {prizeType, prizeValue, couponDiscount} = data;
      if (prizeType === 4) {
        api.log(`获得现金 ${prizeValue}`);
        await apCashWithDraw(data);
        await sleep(5);
      } else if (prizeType === 2) {
        api.log(`获得红包 ${prizeValue}`);
      } else if (prizeType === 1) {
        api.log(`获得优惠券 ${couponDiscount}-${prizeValue}`);
      } else {
        api.log(`获得 ${JSON.stringify(data)}`);
      }
    }

    async function apCashWithDraw({id, poolBaseId, prizeGroupId, prizeBaseId, prizeType}) {
      return api.doFormBody('apCashWithDraw', {
        'businessSource': 'NONE',
        'base': {
          id, poolBaseId, prizeGroupId, prizeBaseId, prizeType,
          'business': 'fission',
        },
      }).then(data => {
        const amount = _.get(data, 'data.record.amount');
        if (amount) {
          api.log(`正在提现${amount}`);
        } else {
          api.log(data.data);
        }
      });
    }

    async function handleDoShare() {
      return doFormBodyFromCharles('inviteFissionBeforeHome');
    }

    async function doFormBodyFromCharles(functionId, formStr = self.charlesFrom[functionId]) {
      if (!formStr) return;
      return api.doFormBody(functionId, void 0, void 0, {
        form: require('../../lib/charles').formatPasteData(formStr),
      });
    }
  }
}

singleRun(Fission).then();

module.exports = Fission;
