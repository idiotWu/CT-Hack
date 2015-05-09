#!/usr/bin/env node

'use strict';

var scopedClient = require('scoped-http-client'),
    querystring = require('querystring'),
    Promise = require('promise'),
    cheerio = require('cheerio'),
    userAgent = require('./component').userAgent,
    sendReq = require('./component').sendReq,
    getLoginUrl = require('./lib').getLoginUrl,
    getCookie = require('./lib').getCookie,
    getPwd = require('./lib').getPwd;

require('colors');

var loginUrl = '',
    loginForm = '';

/**
 * timer
 *
 * @param {Number} ms: 延迟时间
 *
 * @return {Promise}
 */
var delay = function (ms) {
    return function (value) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(value);
            }, ms);
        });
    };
};

/**
 * 保存登录地址
 *
 * @param {String} url
 */
var storeLoginUrl = function (url) {
    loginUrl = url;
};

/**
 * 登录
 *
 * @param {Object} [data]: 登录信息
 *
 * @return {Promise}
 */
var login = function (data) {
    console.log('开始登录...\n'.yellow.bold);

    if (data) {
        data.UserName += '@wlan.sh.chntel.com';
        loginForm = querystring.stringify(data);
    }

    return sendReq(
        scopedClient
            .create(loginUrl)
            .timeout(3e4)
            .headers({
                'User-Agent': userAgent['User-Agent'],
                'Content-Type': 'application/x-www-form-urlencoded'
            })
            .post(loginForm)
    );
};

/**
 * 登出
 *
 * @param {String} url: 登出链接
 *
 * @return {Promise}
 */
var logoff = function (url) {
    console.log('开始注销登录\n'.magenta.bold);

    return sendReq(
        scopedClient
            .create(url)
            .timeout(3e4)
            .headers(userAgent)
            .get()
    );
};

/**
 * 检测登录状态
 *
 * @param {String} result: 登录结果页字串
 *
 * @return {Promise}
 */
var checkLogin = function (result) {
    var data = result.data,
        $ = cheerio.load(data, {
            xmlMode: true
        }),
        loginStatus = $('ResponseCode').text();

    if (parseInt(loginStatus) !== 50) {
        return loginErrorHandler();
    }

    console.log('登录成功！九分半后开始切换账号\t%s\n'.green.bold, (new Date).toTimeString().slice(0, 8));

    console.log('======= Hacked By Dolphin With Node.js =======\n'.green.bold);

    return Promise.resolve(
        $('LogoffURL').text().trim()
    );
};

/**
 * 登出
 *
 * @param {String} result: 登出结果页字串
 *
 * @return {Promise}
 */
var checkLogoff = function (result) {
    var data = result.data,
        $ = cheerio.load(data, {
            xmlMode: true
        }),
        logoffStatus = $('ResponseCode').text();

    if (parseInt(logoffStatus) !== 150) {
        return logoffErrorHandler();
    }

    console.log('> 注销成功\n'.green.bold);
};

/**
 * 登录失败的处理
 *
 * 第一次：delay 1s -> login -> check
 * 第二次: getPwd -> login - check
 *
 * @return {Promise}
 */
var loginErrorHandler = (function () {
    var isSecondTry = false;

    return function () {
        if (isSecondTry) {
            isSecondTry = false;
            console.log('第二次登录失败，开始下一组尝试...\n'.grey.bold);

            return getPwd()
                .then(login)
                .then(checkLogin);
        }

        isSecondTry = true;
        console.log('登录失败，一秒后再次尝试登录...\n'.magenta.bold);

        return delay(1e3)()
            .then(login)
            .then(checkLogin);
    }
})();

/**
 * 登出失败的处理
 *
 * @return {Promise}
 */
var logoffErrorHandler = function () {
    return Promise.reject('> 注销失败\n');
};

/**
 * 保持在线
 */
var infinity = function () {
    return getPwd()
        .then(login)
        .then(checkLogin)
        .then(delay(9.5 * 6e4))
        .then(logoff)
        .then(checkLogoff)
        .then(infinity);
};

console.log([
    '/*!',
    ' * ChinaNet Portal Hacking v1.0.0 by Dolphin @BUCT_SNC_SYS.',
    ' * Copyright 2014 Dolphin Wood.',
    ' * Licensed under http://opensource.org/licenses/MIT',
    ' *',
    ' * Designed and built with all the love in the world.',
    ' *',
    ' * Everything will be done automatically :)',
    ' */\n'
].join('\n').yellow);

getLoginUrl()
    .then(storeLoginUrl)
    .then(getCookie)
    .then(infinity)
    .catch(function (err) {
        console.log('请求出错，请检查网络连接：\n'.red.bold);
        console.log(err.stack || err);

        process.stdin.resume(); // 防止程序退出
    });