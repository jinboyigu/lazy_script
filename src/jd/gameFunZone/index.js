const Template = require('../base/template');

const {sleep, writeFileJSON, singleRun, replaceObjectMethod} = require('../../lib/common');
const {getMoment} = require('../../lib/moment');
const _ = require('lodash');

class GameFunZone extends Template {
  static scriptName = 'GameFunZone';
  static scriptNameDesc = '每日赚钱-签到';
  static dirname = __dirname;
  static shareCodeTaskList = [];
  static commonParamFn = () => ({
    appId: 'game-fun-zone',
    method: 'POST',
    signBusinessId: '4dea1',
    appid: 'game-fun-zone',
  });
  static keepIndependence = true;
  static needInApp = false;
  static times = 1;

  static apiOptions() {
    return {
      options: {
        headers: {
          origin: 'https://jgc.jd.com',
          referer: 'https://jgc.jd.com/game/zone/pages/gameZone/index?jumpFrom=1&source=1',
          'x-referer-page': 'https://jgc.jd.com/game/zone/pages/gameZone/index',
        },
      },
    };
  }

  static async beforeRequest(api) {
    const self = this;
    self.injectEncryptH5st(api, {
      config: {
        dj_interact_games_lobby: {appId: '4dea1'},
        dj_interact_grab_reward: {appId: '4dea1'},
      },
      signFromKEDAYA: true,
    });
  }

  static async doMain(api, shareCodes) {
    const self = this;

    await self.beforeRequest(api);

    const {signList} = await api.doFormBody('dj_interact_games_lobby', {
      'refreshType': 1,
      'source': '1',
    }).then(_.property('task'));
    if (!signList) return api.log('无签到任务');
    for (const {taskEncryptionCode, isTodaySign} of signList) {
      if (isTodaySign !== 1) continue;
      await api.doFormBody('dj_interact_grab_reward', {taskEncryptionCode});
    }
    const {userAsset} = await api.doFormBody('dj_interact_games_lobby', {
      'refreshType': 2,
      'source': '1',
    });
    userAsset && api.log(`累计收益: ${userAsset.map(o => o.assetType === 1 ? `京豆: ${o.dailyEarns}` : `秒送金: ${o.dailyEarns}`).join(', ')}`);
  }
}

singleRun(GameFunZone).then();

module.exports = GameFunZone;
