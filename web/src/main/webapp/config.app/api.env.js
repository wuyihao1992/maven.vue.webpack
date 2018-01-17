/**
 * api接口url
 * ENV = {env: 'xxx', public_path: '/xxxx'}
 */
const env = require('./app.base.conf').env

const nowServerConf = require('./app.' + env + '.conf')

export const ENV = nowServerConf || {}
