/**
 * 用来执行脚本(忽略警告)
 */
const [nodePath, selfPath, filePath, command1/*method*/, command2/*cookie index*/, ...command3/*other params*/] = process.argv;
const {exec} = require('./src/lib/common');

function run() {
  let method = command1;
  const others = [command2, ...command3];
  if (['start', 'cron', 'loop'].includes(command1)) {
    method = command1;
  } else {
    if (filePath.match('src/jd')) {
      method = 'start';
    }
    others.unshift(command1);
  }

  const command = `node ${filePath} ${method} ${others.join(' ')}`;
  console.log(`real > ${command}`);
  exec(command);
}

run();
