/**
 * @date     2015/5/9
 * @author   Dolphin<dolphin.w.e@gmail.com>
 */

'use strict';

var scopedClient = require('scoped-http-client'),
    Promise = require('promise'),
    cheerio = require('cheerio'),
    sendReq = require('../component').sendReq,
    userAgent = require('../component').userAgent,
    reqs = require('../component').requests;

/**
 * 得到重定向地址
 *
 * @return {Promise}
 */
var getRedirectUrl = function () {
    console.log('--> 正在获取网关地址，请稍后...\n'.yellow.bold);

    return sendReq(
        reqs.ping.get()
    );
};

/**
 * 得到登录地址
 *
 * @param {String} url: 重定向地址
 *
 * @return {Promise}
 */
var getLoginUrl = function (url) {
    return sendReq(
        scopedClient.create(url)
            .headers(userAgent)
            .get()
    );
};

/**
 * 解析重定向地址
 *
 * @param {Object} result: 请求结果
 *
 * @return {Promise}
 */
var parseRedirectUrl = function (result) {
    var res = result.response;

    if (res.statusCode !== 302) {
        return Promise.reject('未能获取到重定向地址，请检查网络连接\n');
    }

    return Promise.resolve(res.headers.location);
};

/**
 * 解析登录地址
 *
 * @param {Object} result: 请求结果
 *
 * @return {Promise}
 */
var parseLoginUrl = function (result) {
    var data = result.data,
        $ = cheerio.load(data, {
            xmlMode: true
        }),
        loginUrl = $('LoginURL').text();

    if (!loginUrl) {
        return Promise.reject('未能获取到网关地址，请检查网络连接\n');
    }

    console.log('获取到的登录地址：%s\n'.cyan.bold, loginUrl);

    return Promise.resolve(loginUrl);
};

module.exports = function () {
    return getRedirectUrl()
        .then(parseRedirectUrl)
        .then(getLoginUrl)
        .then(parseLoginUrl);
};