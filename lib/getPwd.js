/**
 * @date     2015/5/9
 * @author   Dolphin<dolphin.w.e@gmail.com>
 *
 * 获取帐密
 */

'use strict';

var Promise = require('promise'),
    sendReq = require('../component').sendReq,
    reqs = require('../component').requests;

/**
 * 得到随机手机号
 *
 * @return {Number}
 */
var getPhoneNumber = (function () {
    var phoneNumPrefix = [135, 136, 137, 138, 139, 147, 150, 151, 152, 157, 158, 159, 182, 183, 184, 187, 188, 130, 131, 132, 155, 156, 185, 186, 133, 153, 180, 181, 189],
        length = phoneNumPrefix.length;

    return function () {
        return Math.floor(
            (
            phoneNumPrefix[Math.random() * length | 0]
            + Math.random()
            ) * 1e8
        );
    }
})();

var phoneNumber = getPhoneNumber();

/**
 * 向购物车添加物品
 *
 * @return {Promise}
 */
var addGood = function () {
    console.log('开始模拟向购物车添加物品...\n'.yellow.bold);

    return sendReq(
        reqs.addGood.get()
    );
};

/**
 * 打开购物车页面
 *
 * @return {Promise}
 */
var list = function () {
    console.log('打开购物车，使请求有效化...\n'.yellow.bold);

    return sendReq(
        reqs.list.get()
    );
};

/**
 * 获取订单号
 *
 * @return {Promise}
 */
var getOrder = function () {
    console.log('开始获取订单号，手机号：%d...\n'.yellow.bold, phoneNumber);

    return sendReq(
        reqs.getOrder
            .query({
                phone: phoneNumber,
                phone_1: phoneNumber
            })
            .get()
    );
};

/**
 * 获取帐密
 *
 * @return {Promise}
 */
var getPwd = function (orderId) {
    console.log('开始获取账号密码...\n'.yellow.bold);

    return sendReq(
        reqs.getPwd
            .query('orderId', orderId)
            .get()
    );
};


/**
 * 解析订单号
 *
 * @param {Object} result: 请求结果
 *
 * @return {Promise}
 */
var parseOrderId = function (result) {
    var data = result.data;

    if (data[0] === '1') {
        phoneNumber++;

        var orderId = data.split(',')[1];
        console.log('得到的订单号：%s\n'.cyan.bold, orderId);

        return Promise.resolve(orderId);
    }

    if (data.match('购物车为空')) {
        console.log('购物车为空，将再次向购物车添加商品！\n'.magenta.bold);

        return addGood()
            .then(list)
            .then(getOrder)
            .then(parseOrderId);
    }

    var statusCode = result.response.statusCode;

    if (statusCode !== 200) {
        console.log('服务器响应：%s，将更新手机号后再次尝试！\n'.grey.bold, statusCode);
    } else {
        console.log('%s || 没有得到帐密，将更新手机号后再次尝试\n'.grey.bold, data);
    }

    phoneNumber = getPhoneNumber();

    return getOrder().then(parseOrderId);
};

/**
 * 解析账密
 *
 * @param {Object} result: 请求结果
 *
 * @return {Promise}
 */
var parsePwd = function (result) {
    var data = result.data;

    console.log('收到的数据：%s\n'.cyan.bold, data);

    if (data.match('次数过多')) {
        return Promise.reject('已达到当日请求数上限（50次），请手动刷新 IP\n');
    }

    // 数据格式如：1,-1,-1,-1,W90032207885,84491176
    var tmp = data.split(',');

    if (tmp[4] && tmp[5]) {
        return Promise.resolve({
            UserName: tmp[4],
            Password: tmp[5]
        });
    }

    console.log('未获取到，开始下一组尝试...\n'.grey.bold);

    return getOrder()
        .then(parseOrderId)
        .then(getPwd)
        .then(parsePwd);
};

module.exports = function () {
    return addGood()
        .then(list)
        .then(getOrder)
        .then(parseOrderId)
        .then(getPwd)
        .then(parsePwd);
};