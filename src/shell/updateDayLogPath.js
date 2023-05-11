/**
 * @description 更新日志的软连接
 */

const {getNowDate} = require('../lib/moment');
const {getLogFile, exec} = require('../lib/common');

function main() {
  const isWin = process.platform === 'win32';
  const _do = () => {
    for (const name of ['request', 'app']) {
      const logFile = getLogFile(name);
      exec(`touch ${logFile}`);
      const fileName = getLogFile(name, '');
      if (isWin) {
        exec(`rm -rf ${fileName}`);
      }
      exec(`ln -snf ${logFile} ${fileName}`);
    }
  };

  _do();
  // windows 下需要实时更新
  if (isWin) {
    let timer;
    let times = 0;
    const maxTimes = 10;
    process.on('printLog', () => {
      times++;
      if (times < maxTimes) {
        timer && clearTimeout(timer);
        timer = setTimeout(_do, 3000);
        return;
      }
      _do();
      times = 0;
    });
    process.on('beforeExit', _do);
  }
}

main();
