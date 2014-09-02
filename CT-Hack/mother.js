var input = process.stdin;
var output = process.stdout;

var http = require('http');
var https = require('https');
var parseUrl = require('url').parse;
var child = require('child_process');
var querystring = require('querystring');
var colors = require('./node_modules/colors');
var cheerio = require('./node_modules/cheerio');

var curStatus = {
    crashed: false,
    loginUrl: null
};

var getRedirectUrl = function (cb) {
    // callback: string redirectUrl
    http.get('http://www.baidu.com', function (res) {
        if (res.statusCode === 302) {
            var redirectUrl = res.headers.location;
            cb(redirectUrl);
        } else {
            console.log('没有获得网关地址，请检查网络连接'.red.bold);
        }
    }).on('error', function (e) {
        console.log(('请求出错: ' + e.message + ',请检查网络连接').red.bold);
    });
};

var getLoginUrl = function (cb) {
    // callback: string loginUrl
    getRedirectUrl(function (url) {
        url = parseUrl(url);
        https.get({
            host: url.host,
            path: url.path,
            headers: {
                'User-Agent': 'CDMA+WLAN'
            }
        }, function (res) {
            res.setEncoding('utf8');
            var xml = '';
            res.on('data', function (chunk) {
                // 得到的是一个 xml 文件
                xml += chunk;
            }).on('end', function () {
                var $ = cheerio.load(xml, {
                    xmlMode: true
                });
                var loginUrl = $('LoginURL').text();
                cb(loginUrl);
            });
        }).on('error', function (e) {
            console.log(('请求出错: ' + e.message + ',请检查网络连接').red.bold);
        });
    });
};

var connect = function () {
    curStatus.crashed = false;
    input.pause();
    hack = child.fork('./main.js');
    hack.on('data', function (data) {
        // 同步输出
        console.log(data);
    }).on('exit', function () {
        // 子进程退出
        delete hack;
        curStatus.crashed = true;
        console.log('检测到主进程退出！\n'.magenta.bold);
        output.write('是否重启进程（Y/N）');
        input.resume(); // 恢复输入监听
    }).on('message', function (phone) {
        // 同步手机号
        curStatus.phone = phone;
    }).send(curStatus);
};

console.log('/*!\n* ChinaNet Portal Hacking v0.3.5 by Dolphin @BUCT_SNC_SYS.\n* Copyright 2014 Dolphin Wood.\n* Licensed under http://opensource.org/licenses/MIT\n*\n* Designed and built with all the love in the world.\n*\n* Everything will be done automatically :)\n*/\n'.yellow);
console.log('进程守护已启动！\n'.magenta.bold);

console.log('--> 正在获取网关地址，请稍后...\n'.yellow.bold);

getLoginUrl(function (url) {
    if (!url) {
        return console.log('未能获取到网关地址，请检查网络连接\n'.red.bold);
    }
    console.log(('获取到的地址：' + url + '\n').cyan.bold);
    curStatus.loginUrl = parseUrl(url);
    connect(); // 开始建立子进程
});

input.resume();
input.setEncoding('utf8');
input.on('data', function (text) {
    text = text.trim();
    if (curStatus.crashed) {
        // 进程中断
        var T = text.toUpperCase();
        if (T === "Y") {
            console.log('正在重启主进程...\n'.green.bold);
            input.pause();
            return connect(); // 重启进程
        } else if (T === "N") {
            process.exit();
        } else {
            return output.write('\n是否重启进程（Y/N）：');
        }
    }
});