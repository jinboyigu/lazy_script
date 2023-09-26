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
  const isWin = process.platform === 'win32';
  const addProxy = str => isWin ? str : str.replace('curl', 'curl -x 127.0.0.1:8888 -s');
  // windows 抓获的数据需要转换才能在 windows 中执行
  const formatJSON = str => str.replace(/"/g, '\\"').replace(/'/g, '"');
  const exec = async str => JSON.parse(await execSync(addProxy(formatJSON(str)), isWin ? {
    // windows 需指定路径
    env: {CURL_CA_BUNDLE: 'D:\\Program Files\\Git\\mingw64\\ssl\\certs\\ca-bundle.crt'},
  } : void 0));
  await handleWatchVideo();

  async function handleWatchVideo() {
    const videoResult = await exec(getVideo);
    console.log(JSON.stringify(videoResult));
    if (videoResult.errno !== 0) return;
    console.log('getVideo success');
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
    console.log(JSON.stringify(sendVideoRewardResult));
    if (sendVideoRewardResult.errno !== 0) return;
    console.log('sendVideoReward success');
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
