/* 执行某个时间段的 app.js */
global.isRunHour = true;
const [nodePath, filePath, hour = 0] = process.argv;
require('./lib/moment').setNowHour(+hour);
require('./app');
