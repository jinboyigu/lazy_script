const _ = require('lodash');
const {execSync} = require('child_process');
const {sleep} = require('../../lib/common');
const curlRequest = require('./curlRequest.json');
// 获取次数
// https://game.xiaojukeji.com/api/game/parkour/getVideo
// 单次完成
// https://game.xiaojukeji.com/api/game/parkour/sendVideoReward
const {getVideo, sendVideoReward} = curlRequest;

// 自动看广告获取体力
async function autoWatchVideo() {
  const exec = async str => JSON.parse(await execSync(str.replace('curl', 'curl -x 127.0.0.1:8888 -s')));
  await handleWatchVideo();

  async function handleWatchVideo() {
    const videoResult = await exec(getVideo);
    if (videoResult.errno !== 0) return;
    console.log('getVideo success');
    console.log(JSON.stringify(videoResult));
    if (videoResult.data.watch_times >= 30) return;
    const time = Math.floor(new Date().getTime() / 1000);
    console.log('await sendVideoReward 30s');
    await sleep(30);
    const {id, type} = videoResult.data.prod_video_info[0];
    const sendVideoRewardResult = await exec(sendVideoReward, replaceByReg({
      video_type: type,
      video_id: id,
      video_start_time: time,
    }, key => `\\\\?"${key}\\\\?":\\s?(\\d+),`));
    if (sendVideoRewardResult.errno !== 0) return;
    console.log('sendVideoReward success');
    console.log(JSON.stringify(sendVideoRewardResult));
    await sleep(2);
    await handleWatchVideo();
  }
}

function replaceByReg(str, data, regFn) {
  _.forEach(data, (value, key) => {
    // TODO 替换成$1${value}的形式
    str = str.replace(new RegExp(regFn(key, value)), (s1, s2) => s1.replace(s2, value));
  });
  return str;
}

autoWatchVideo().then(() => {
  console.log('执行结束');
});
