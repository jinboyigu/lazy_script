const Template = require('./index');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class FissionLite extends Template {
  static scriptName = 'FissionLite';
  static scriptNameDesc = '转赚红包-极速版';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static linkId = 'Wvzc_VpNTlSkiQdHT8r7QA';
  static commonParamFn = () => ({
    body: {linkId: this.linkId},
    appid: 'activities_platform',
    client: 'ios',
    clientVersion: '6.3.0',
    'x-api-eid-token': 'jdd033MPEA6CNFKVKER5LIHQMCE2W54WCWJEPSNYQ4QIQZV5DLMYA5SXH6GIGHMMVLRESESN5ANEDZ7KRUYTKVL5OALNZMEAAAAMKU54S3MYAAAAADBSP3WWMGK6SOMX',
  });

  static apiOptions() {
    return {
      options: {
        headers: {
          'user-agent': 'jdltapp;iPhone;6.3.0;;;M/5.0;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;hasOCPay/0;appBuild/1372;supportBestPay/0;jdSupportDarkMode/0;jxtj/tj;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22CzYyCtK5YJq3DJU5YtCnYzTuYWG3ENYmYzS3CtrsDWYzEJruCWVvDq%3D%3D%22%2C%22sv%22%3A%22CJYkDq%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1695029032%2C%22hdid%22%3A%22HcdgblbG8B1wVnKMAQBctEKCELRAg%2BJbm1yeBVk2bnM%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.jd.jdmobilelite%22%2C%22ridx%22%3A1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
          origin: 'https://pro.m.jd.com',
          'x-referer-page': 'https://pro.m.jd.com/jdlite/active/23CeE8ZXA4uFS9M9mTjtta9T4S5x/index.html',
          'referer': 'https://pro.m.jd.com/jdlite/active/23CeE8ZXA4uFS9M9mTjtta9T4S5x/index.html?inviterId=CeymEOdTGnhBzMjmwC12IA&originId=Wvzc_VpNTlSkiQdHT8r7QA&inviteCode=voN1y2F4JuplvN6EKiBjFQarWQskNkFpjZdjyj5iV5k&channelType=1&femobile=femobile&activityChannel=jdlite&lng=0.000000&lat=0.000000&sid=bcd48995a7c4370b2102d07eb775e06w&un_area=19_1601_36953_50400',
        },
      },
    };
  }

  static charlesFrom = {
    inviteFissionBeforeHome: `body\t{"linkId":"Wvzc_VpNTlSkiQdHT8r7QA","isJdApp":true,"inviter":"CeymEOdTGnhBzMjmwC12IA"}
t\t1695029033882
appid\tactivities_platform
client\tios
clientVersion\t6.3.0
h5st\t20230918172354274;niz963mm35533m69;02f8d;tk03w86141bf518nEBQX3Ud0Tso9721jDnCQmQUa5KboLfela9gW0zOJkcZIM13zzCsJ1GFvczXcdbGIVosrhlILU5QV;b3d6b0e4b60537fe1384b59e8f9f5efd;4.1;1695029034274;5f7a486ba29fbc5d176654e46394ec5e0bd88693c61e67c8c7fe08d7d4a9d65657c2cd8d66ddd0104f70ee0a2d3f6a7b4fa36f462043e7f27a7b0dd4de3193de37a447c8f9f2ec43fb247e391851408a399f2b593e94ea1c863a768e208458e7154ba0704f6c18a671688b546ae9f1b0e6454b1383c4cca6dd110c58091a5fa69829a78f9fb73807af333af01fa8ebf91dc41f22ef3b70374611ba0f4e39b473f1f44d67fa73c11ab8a0dbe5584926cc464a25d110e77dd0e63d5968979849a53ab2e0b833a4fd4116e84999cc703667e692bda6664c15e4cad76ce388077085b071d3c09f67eb4640c63845e45195a8334d38b1c427d30eb3a825b9492703c4
x-api-eid-token\tjdd033MPEA6CNFKVKER5LIHQMCE2W54WCWJEPSNYQ4QIQZV5DLMYA5SXH6GIGHMMVLRESESN5ANEDZ7KRUYTKVL5OALNZMEAAAAMKU54S3MYAAAAADBSP3WWMGK6SOMX
uuid\t362209a87559b31c2dad7860c2728b5f398d1ee6
build\t1372
screen\t390*844
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
lang\tzh_CN
osVersion\t16.6
partner\t-1
cthr\t1`,
    inviteFissionDrawPrize: `body\t{"linkId":"Wvzc_VpNTlSkiQdHT8r7QA"}
t\t1695029992012
appid\tactivities_platform
client\tios
clientVersion\t6.3.0
h5st\t20230918173952025;z56tn93miggm33h8;c02c6;tk03we7f21dd618npxxJOakKrvvqdu4NYWAs27lKiF2E9nfc0NXucb6VvvKvYITLRznW_wyqg7wYL8M4fqENyYgzEzXn;0af3d1dc414bea4e690bf8861b0939b0;4.1;1695029992025;5f7a486ba29fbc5d176654e46394ec5e0bd88693c61e67c8c7fe08d7d4a9d65657c2cd8d66ddd0104f70ee0a2d3f6a7b4fa36f462043e7f27a7b0dd4de3193de37a447c8f9f2ec43fb247e391851408a399f2b593e94ea1c863a768e208458e7154ba0704f6c18a671688b546ae9f1b0e6454b1383c4cca6dd110c58091a5fa69829a78f9fb73807af333af01fa8ebf91dc41f22ef3b70374611ba0f4e39b473f1f44d67fa73c11ab8a0dbe5584926cc1f5c5914b20594b2888105fcedf93c31f457259b098ad97768be74068534e1a9edcb8b3f4b5478705e89b513352c517c041f93bc86f2ab44311e2ec686a8b6f21d317acc79f19e2ea4b8b9833b4d1277
x-api-eid-token\tjdd033MPEA6CNFKVKER5LIHQMCE2W54WCWJEPSNYQ4QIQZV5DLMYA5SXH6GIGHMMVLRESESN5ANEDZ7KRUYTKVL5OALNZMEAAAAMKU54S3MYAAAAADBSP3WWMGK6SOMX
uuid\t362209a87559b31c2dad7860c2728b5f398d1ee6
build\t1372
screen\t390*844
networkType\twifi
d_brand\tiPhone
d_model\tiPhone13,3
lang\tzh_CN
osVersion\t16.6
partner\t-1
cthr\t1`,
  };
}

singleRun(FissionLite).then();

module.exports = FissionLite;
