const _ = require('lodash');
const {getNowDate, getNowHour} = require('./lib/moment');
const {getCookieData, updateProcessEnv, processInAC, getEnv} = require('./lib/env');
const {sleepTime} = require('./lib/cron');
const {sleep} = require('./lib/common');
// TODO 放到每个脚本执行前
require('../src/lib/common').exec('node src/shell/updateEnvFromMail.js');
updateProcessEnv();
const {
  multipleRun,
  serialRun,
  doRun,
  doRun1,
  doCron,
  doCron1,
  TemporarilyOffline,
  sendNotify,
} = require('./api');

const Common = require('./jd/base/common');

const Sign = require('./jd/sign');
const Sign1 = require('./jd/sign/Sign1');
const SignShop = require('./jd/sign/shop');
const SignTurnTable = TemporarilyOffline || require('./jd/sign/TurnTable');
const PlantBean = require('./jd/plantBean');
const SuperMarket = TemporarilyOffline || require('./jd/superMarket');
const SuperMarketRedeem = require('./jd/superMarket/redeem');
const Fruit = require('./jd/fruit');
const FruitDoShare = require('./jd/fruit/doShare');
const TurnTableFarm = require('./jd/fruit/turnTableFarm');
const FruitFarmPark = require('./jd/fruit/FarmPark');
const FruitCollect = TemporarilyOffline || require('./jd/fruit/Collect');
const Harmony1 = require('./jd/wfh/harmony1');
const Harmony2 = require('./jd/wfh/harmony2');
const Harmony3 = require('./jd/wfh/harmony3');
const Harmony4 = require('./jd/wfh/harmony4');
const Harmony5 = require('./jd/wfh/harmony5');
const SplitHongbao = require('./jd/wfh/splitHongbao');
const Health = TemporarilyOffline || require('./jd/wfh/Health');
const HealthShare = TemporarilyOffline || require('./jd/wfh/HealthShare');
const HealthSign = TemporarilyOffline || require('./jd/wfh/HealthSign');
const Cash = require('./jd/cash');
const CashApplet = require('./jd/cash/applet');
const CashShare = require('./jd/cash/share');
const StatisticsBean = require('./jd/statistics/bean');
const StatisticsRedEnvelope = require('./jd/statistics/RedEnvelope');
const IsvShopSign = TemporarilyOffline || require('./jd/isv/shopSign');
const VipClubShake = require('./jd/vipClub/shake');
let Joy = require('./jd/joy');
const JoyRedeem = require('./jd/joy/redeem');
const JoySign = require('./jd/joy/Sign');
const Family = TemporarilyOffline || require('./jd/family');
const BianPao = require('./jd/family/bianPao');
const JxHongBao = require('./jd/family/jxHongBao');
const JxFarm = require('./jd/wq/JxFarm');
const LuckyToHitTheGoldenEgg = require('./jd/family/LuckyToHitTheGoldenEgg');
const Live = TemporarilyOffline || require('./jd/live');
const LiveRedEnvelopeRain = TemporarilyOffline || require('./jd/live/RedEnvelopeRain');
const SignBeanHome = require('./jd/sign/beanHome');
const BeanSignApplet = TemporarilyOffline || require('./jd/wq/BeanSignApplet');
const Carnivalcity = require('./jd/shoppingFestival/carnivalcity');
const BeanSmallBean = require('./jd/sign/beanSmallBean');
const GoldCreator = TemporarilyOffline || require('./jd/goldCreator');
const Joy20210805 = require('./jd/joy/20210805');
const SuperBrandDay = require('./jd/superBrand/day');
const SuperBrandProduct = TemporarilyOffline || require('./jd/superBrand/Product');
const RubikSCube = TemporarilyOffline || require('./jd/rubikSCube');
const PointsGasStation = require('./jd/dwapp/PointsGasStation');
const ExplorePlanet = require('./jd/explorePlanet');
const WanYiWan = require('./jd/turnHappy/WanYiWan');
const SuperLeague = require('./jd/superLeague');
const NewTry = require('./jd/newtry');
const SecKillView = require('./jd/seckillView');
const Fission = require('./jd/fission');
const AppletSign = require('./jd/applet/sign');

/* 极简模式 */
const BSign = require('./jd/bSign');
const RichTree = require('./jd/richTree');
const Lhb4b = require('./jd/lhb4b');

/* 极速版 */
const LiteSpringReward = TemporarilyOffline || require('./jd/lite/SpringReward');
const LiteEarnCoins = TemporarilyOffline || require('./jd/lite/EarnCoins');
const LiteCashSign = TemporarilyOffline || require('./jd/lite/CashSign');
const LiteHappyDig = require('./jd/lite/HappyDig');
const LiteJoyPark = require('./jd/lite/JoyPark');

/* 本地执行 */
const ReceiveNecklaceCoupon = require('./jd/local/ReceiveNecklaceCoupon');

const nowDate = getNowDate();
const nowHour = getNowHour();
const _send = processInAC() ? sendNotify.bind(0, {
  sendYesterdayLog: nowHour === 23,
  subjects: [void 0, nowDate, nowHour],
}) : _.noop;
// 超时需自动退出
const autoExit = async () => {
  await sleep(60 * 60 * 2);
  _send();
  process.exit();
};

if (processInAC()) {
  Joy = TemporarilyOffline;
}

!getEnv('DISABLE_AUTO_EXIT') && autoExit();
main().then(_send).then(async () => {
  await sleep(10);
  process.exit();
});

async function main() {
  if (process.env.NOT_RUN) {
    console.log('不执行脚本');
    return;
  }

  // 统计
  const statistics = [
    StatisticsBean,
    StatisticsRedEnvelope,
  ];
  // 常驻活动
  const longTermActivity = [
    SignBeanHome, Sign,
    Fruit, TurnTableFarm,
    FruitFarmPark, FruitCollect,
    Cash,
    CashApplet,
    BeanSmallBean,
    PlantBean,
    Family,
    Live,
    VipClubShake,
    SuperMarket,
    GoldCreator,
    PointsGasStation,
    BeanSignApplet,
    ExplorePlanet,
    WanYiWan,
    SuperLeague,
    NewTry,
    SecKillView,
    Fission,
    AppletSign,
    BSign,
    RichTree,
    Lhb4b,
  ];
  // 极速版
  const lites = [
    LiteSpringReward, LiteCashSign, LiteEarnCoins, LiteHappyDig,
  ];
  // 短期活动
  const shortTermActivity = [
    RubikSCube,
    SuperBrandProduct,
    SplitHongbao,
    require('./jd/618/FirePower'),
  ];
  const scheduleOptions = [
    {
      valid: 0,
      run: async () => {
        multipleRun([
          HealthSign,
          HealthShare,
          Health,
        ]);
        await serialRun([
          // 23点后的活动补充
          IsvShopSign,
          SignShop,

          ...statistics,
          ...longTermActivity,
          ...lites,
          ...shortTermActivity,
        ]);
        await multipleRun([
          // Harmony1,
          // Harmony2,
          // Harmony3,
          // Harmony4,
          // Harmony5,
        ]);
      },
    },
    {
      valid: 5,
      run: async () => {
        // await doRun(JxFarm);
        await doRun(LiteEarnCoins);
      },
    },
    {
      valid: 6,
      run: async () => {
        await doCron(TurnTableFarm);
        await serialRun(Joy);
      },
    },
    {
      valid: 7,
      run: async () => {
        await serialRun([
          Fruit,
          LiteEarnCoins,
          Family,
          WanYiWan,
        ]);
      },
    },
    {
      valid: 9,
      run: async () => {
        await serialRun(Joy);
      },
    },
    {
      valid: 10,
      run: async () => {
        await doRun(SuperBrandProduct);
      },
    },
    {
      valid: 12,
      run: async () => {
        await serialRun([
          Fruit,
          PlantBean,
        ]);
      },
    },
    {
      valid: 14,
      run: async () => {
        await doRun(SuperBrandProduct);
      },
    },
    {
      valid: 15,
      run: async () => {
      },
    },
    {
      valid: 16,
      run: async () => {
      },
    },
    {
      valid: 18,
      run: async () => {
        await serialRun([
          Fruit,
          PlantBean,
          SuperBrandProduct,
        ]);
      },
    },
    {
      valid: 19,
      run: async () => {
        await doRun(LiteEarnCoins);
      },
    },
    {
      valid: 20,
      run: async () => {
        await serialRun([
          SuperBrandProduct,
        ]);
      },
    },
    {
      valid: 22,
      run: async () => {
        await serialRun([
          Fruit,
          LiteEarnCoins,
          CashApplet,
          SuperMarket,
          ...statistics,
          LiteHappyDig,
          SuperBrandDay,
          SplitHongbao,
          WanYiWan,
        ]);
      },
    },
    {
      valid: 23,
      run: async () => {
        await serialRun([
          LiteHappyDig,
          Sign,
          Cash,
          PlantBean,
          [PlantBean, void 0, 'cron'],
          SuperBrandProduct,
          Joy,
          Fruit,
        ]);

        // 24点后定时启动
        // 本身自带定时任务的脚本
        multipleRun([
          SignShop,
          // SuperMarketRedeem,
          // JoyRedeem,
        ]);
        await sleepTime(24);
        await multipleRun([
          [Health, void 0, 'cron'],
          // JoySign,
          SignTurnTable,
          Sign1,
          IsvShopSign,
        ], 0);
      },
    },
  ];

  if (!global.isRunHour && !processInAC()) {
    // local dev
    // do something
    // await doRun();
    return;
  }

  await cronLoop();

  for (const {valid, run} of scheduleOptions) {
    if (nowHour === valid) {
      await run();
    }
  }

  // 定时循环
  async function cronLoop() {
    await serialRun([
      PlantBean,
      Health,
    ], doCron);

    if (nowHour % 5 === 0) {
      await serialRun(Joy, doCron);
    }

    if (nowHour % 6 === 0) {
      await serialRun(SuperMarket, doCron);
    }
  }
}
