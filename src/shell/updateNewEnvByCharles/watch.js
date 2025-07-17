const fs = require('fs');
const path = require('path');
const {exec, readFileJSON} = require('../../lib/common');
const _ = require('lodash');

const rootPath = path.resolve(__dirname, '../../../');

fs.watch(rootPath, async (eventType, filename) => {
  console.log(`事件类型: ${eventType}, 文件名: ${filename}`);

  // 在这里处理文件夹变化事件
  // 例如，可以根据文件名和事件类型执行不同的操作
  if (eventType === 'rename') {
    if (filename.endsWith('.chlsj')) {
      if (fs.existsSync(path.resolve(rootPath, filename))) {
        exec(`node ${path.resolve(__dirname, 'index.js')}`);
        _.get(readFileJSON('.env.local.json', rootPath, {}), 'OTHERS_CONFIG.needRunCommonTask') && exec(`node ${path.resolve(rootPath, 'src/runHour.js')}`);
      }
    }
    // 文件或目录被重命名或删除
    // console.log(`文件/目录 ${filename} 已被重命名或删除`);
  } else if (eventType === 'change') {
    // 文件内容被修改
    console.log(`文件 ${filename} 已被修改`);
  }
});
