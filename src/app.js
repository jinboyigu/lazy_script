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
  [['*'], require('./jd/plantBean'), 0, true],
  [['*'], require('./jd/fruit/1Wheels')],
  // hour0
  ...[
    require('./jd/sign/beanSmallBean'),
    // TODO 确认 turnTableFarm 是否正常
    // require('./jd/fruit/turnTableFarm'),
    require('./jd/dwapp/PointsGasStation'),
    require('./jd/superLeague'),
    require('./jd/newtry'),
    require('./jd/seckillView'),
    require('./jd/fission'),
    require('./jd/applet/sign'),
    require('./jd/bSign'),
    require('./jd/richTree'),
    require('./jd/lhb4b'),
    require('./jd/superBrand/Product'),
    require('./jd/fruit/1Share'),
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
  [[5], require('./jd/applet/morningHbReward')],
  // [[6], require('./jd/fruit/turnTableFarm'), 0, true],
  [[0, 7, 12, 18, 22, 23], require('./jd/fruit')],
  [[5, 10, 19, 20], require('./jd/fruit/1')],
  [[0, 12, 18, 22, 23], require('./jd/plantBean')],
  [[0, 7, 22, 23], require('./jd/lite/HappyDig')],
  [[0, 7, 22, 23], require('./jd/applet/mini')],
  // [[0, 5, 10, 15, 20], require('./jd/lite/JoyPark')],
  // 定时任务
  [[23], require('./jd/local/EarnJoinGroup'), 60],
], {name: require('path').basename(__filename)});
