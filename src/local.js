/**
 *
 * @description 本地执行脚本(查缺补漏)
 *
 */

require('./appBase')([
  // 实时执行
  [['*'], require('./jd/fruit/1Wheels')],
  [[0, 4, 8, 9, 12, 20, 22], require('./jd/joy')],
  [[1, 7, 18], require('./jd/dwapp/PointsGasStation')],
  [[7, 15, 21], require('./jd/plantBean')],
  [[10, 12, 23], require('./jd/turnHappy/WanYiWan')],
  [[0, 10, 20], require('./jd/lite/JoyPark'), {weekday: 1}],
  [[0], require('./jd/618/FirePower')],
  [[13, 19, 22], require('./jd/fruit/1')],
  // 定时任务
  [[19], require('./jd/superRedBagDraw'), 25],
  [[23, 10, 22], require('./jd/fission'), 32],
  [[23, 7, 15], require('./jd/joy/redeem'), 54],
  // [[23], require('./jd/turnHappy/WanYiWan'), 60],
], {name: require('path').basename(__filename), sendLocalMail: true});
