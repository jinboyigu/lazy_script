/**
 *
 * @description github action 执行脚本
 * 执行小时 0,5,7,9,10,12,14,15,16,18,19,20,22,23
 *
 */

const _ = require('lodash');

require('./appBase')(!global.isRunHour && !require('./lib/env').processInAC() ? [
  // local dev
  [['*'], _.noop],
] : [
  // 实时执行
  [['*'], require('./jd/plantBean'), 0, {isCron: true}],
  // hour0
  ...[
    require('./jd/sign/beanSmallBean'),
    // require('./jd/dwapp/PointsGasStation'),
    require('./jd/superLeague'),
    require('./jd/newtry'),
    require('./jd/seckillView'),
    // require('./jd/fission'),
    // require('./jd/fission/1'),
    require('./jd/applet/sign'),
    require('./jd/richTree'),
    require('./jd/lhb4b'),
    require('./jd/superBrand/Product'),
    require('./jd/fruit/1Share'),
    require('./jd/gameFunZone'),
    require('./jd/day/20241112'),
  ].map(target => [[0], target]),
  // run 2
  ...[
    require('./jd/statistics/RedEnvelope'),
    require('./jd/statistics/bean'),
    require('./jd/sign'),
    require('./jd/purchaseCard'),
  ].map(target => [[0, 22], target]),
  // run 3
  ...[
    require('./jd/turnHappy/WanYiWan'),
  ].map(target => [[0, 7, 22], target]),

  // custom
  // [[5], require('./jd/applet/morningHbReward')],
  [[0, 16, 22, 23], require('./jd/chatReward')],
  // [[7, 12, 18, 20], require('./jd/fruit/1')],
  [[0, 12, 18, 22, 23], require('./jd/plantBean')],
  [[0, 7, 22, 23], require('./jd/lite/HappyDig')],
  // [[0, 7, 22, 23], require('./jd/applet/mini')],
  // 定时任务
  // [[23], require('./jd/local/EarnJoinGroup'), 60],
], {name: require('path').basename(__filename)});
