const _ = require('lodash');
const [nodePath, filePath, day] = process.argv;
require('../lib/env').updateProcessEnv();
require('../lib/mailer').updateEnvFromMail(_.isNil(day) ? day : +day);
