/**
 *
 * @description 本地执行脚本(查缺补漏)
 *
 */

require('./appBase')([
  [[0, 4, 8, 9, 12, 20, 22], require('./jd/joy')],
  [[1, 7, 18], require('./jd/dwapp/PointsGasStation')],
  [[7, 15, 21], require('./jd/plantBean')],
  [[7, 14, 20, 22, 23], require('./jd/turnHappy/WanYiWan')],
  // 定时任务
  [[19], require('./jd/superRedBagDraw'), 25],
  [[23, 10, 22], require('./jd/fission'), 32],
  [[23, 7, 15], require('./jd/joy/redeem'), 54],
  [[23], require('./jd/turnHappy/WanYiWan'), 60],
], {name: require('path').basename(__filename), sendLocalMail: true});
