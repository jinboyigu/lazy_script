/**
 * @description 输出日志内容
 */

const _ = require('lodash');
const {getLogs} = require('../lib/common');
const {getMoment} = require('../lib/moment');
const [nodePath, filePath, prevDay = '0', cookieIndex, filterContent] = process.argv;

function main() {
  let contents = getLogs('app', getMoment().subtract(+prevDay, 'd').format('YYYY-MM-DD'), true)
  .filter(o => (cookieIndex && cookieIndex !== '*') ? o.cookie === cookieIndex : true)
  .filter(o => filterContent ? o.origin.match(filterContent) : true);
  console.log(_.map(contents, 'origin').join('\n'));
}

main();

