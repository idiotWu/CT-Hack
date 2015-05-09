/**
 * @date     2015/5/9
 * @author   Dolphin<dolphin.w.e@gmail.com>
 *
 * 获得 cookie
 */

'use strict';

var sendReq = require('../component').sendReq,
    reqs = require('../component').requests;

/**
 * 发起请求，获得 cookie
 *
 * @return {Promise}
 */
var linkStart = function () {
    console.log('开始模拟购买时长卡...\n'.yellow.bold);

    return sendReq(
        reqs.start.get()
    );
};

/**
 * 解析得到的 cookie
 *
 * @param {Object} result: 请求结果
 */
var parseCookie = function (result) {
    var res = result.response;

    var cookie = res['headers']['set-cookie'][0].split(';')[0];

    console.log('获得的 cookie：%s\n'.cyan.bold, cookie);

    [
        'addGood',
        'list',
        'getOrder'
    ].forEach(function (type) {
            reqs[type].header('cookie', cookie);
        });
};

module.exports = function () {
    return linkStart().then(parseCookie);
};