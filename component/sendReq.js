/**
 * @date     2015/5/9
 * @author   Dolphin<dolphin.w.e@gmail.com>
 *
 * 发送 http 请求
 */

var Promise = require('promise');


/**
 * 发起请求
 *
 * @param {ScopedClient} cli
 *
 * @return {Promise}
 */

'use strict';

module.exports = function (cli) {
    if (!cli) {
        throw new Error('Client request not found');
    }

    return new Promise(function (resolve, reject) {
        cli(function (err, res, data) {
            if (err) {
                return reject(err);
            }

            resolve({
                response: res,
                data: data
            });
        });
    });
};