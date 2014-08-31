var input = process.stdin;
var output = process.stdout;
input.resume();
input.setEncoding('utf8');

var http = require('http');
var https = require('https');
var parseUrl = require('url');
var child = require('child_process');
var colors = require('./node_modules/colors');
var cherrio = require('./node_modules/cheerio');
var AsciiTable = require('./node_modules/ascii-table');

var curStatus = {
    phone: undefined,
    crashed: false,
    loginHost: undefined,
    loginPath: undefined,
    loginForm: null
};

var httpsGet = function (url, cb) {
    // 发起 GET 请求
    var req = https.get(url, function (res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        }).on('end', function () {
            cb(res, data);
        });
    });

    req.on('error', function (e) {
        console.log(('请求出错: ' + e.message + ',请检查网络连接').red.bold);
    });
};

var isEmptyObj = function (obj) {
    for (var key in obj) {
        return false;
    }
    return true;
};

var getRedirectUrl = function (url, cb) {
    // 获取重定向网址
    // callback: url(https)
    var getStatus = function (res) {
        var statusCode = res.statusCode;
        if (statusCode === 302) {
            // 再次被重定向
            var redirect = res.headers.location;
            return getRedirectUrl(redirect, cb);
        } else if (statusCode === 200) {
            // 直到打开网关为止
            return cb(url);
        }
        return cb(undefined);
    };

    if (url.indexOf('https') === -1) {
        return http.get(url, getStatus).on('error', function (e) {
            console.log(('请求出错: ' + e.message + ',请检查网络连接').red.bold);
        });
    };

    httpsGet(url, getStatus);
};

var getLoginForm = function (cb) {
    // 获取登录表单
    // callback: object loginForm
    getRedirectUrl('http://www.baidu.com', function (url) {
        if (!url || url === 'http://www.baidu.com') {
            console.log('未获取到表单（原因：没有得到网关地址）'.red.bold);
            return cb(null);
        }

        var table = new AsciiTable('LOGIN FORM');
        table.setHeading('NAME', 'VALUE');

        var urlInfo = parseUrl.parse(url);
        var prefix = urlInfo.pathname || '/portal/';
        prefix = prefix.match(/\/.*\//)[0];

        var loginHost = curStatus.loginHost = urlInfo.host || 'wlan.ct10000.com'; // 登录 host
        table.addRow('host', loginHost);

        httpsGet(url, function (res, data) {

            var $ = cherrio.load(data);
            var loginForm = {};

            var loginPath = prefix + $('#loginForm').attr('action'); // 从表单中获得登录 path
            curStatus.loginPath = loginPath;
            table.addRow('path', loginPath);

            $('#loginForm > input').each(function () {
                var name = $(this).attr('name');
                var value = $(this).attr('value');
                table.addRow(name, value);
                loginForm[name] = value;
            });

            if ('postfix' in loginForm) {
                // 修正表单信息
                loginForm.postfix = '@wlan.sh.chntel.com';
                loginForm.address = 'sh';
            }

            if (isEmptyObj(loginForm)) {
                // 未获取到则重试
                console.log('未获取到表单，正在重试...'.red);
                return getLoginForm(cb);
            }

            console.log(table.toString().yellow);
            cb(loginForm);
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

(function () {
    console.log('/*!\n* ChinaNet Portal Hacking v0.2.0 by Dolphin @BUCT_SNC_SYS.\n* Copyright 2014 Dolphin Wood.\n* Licensed under http://opensource.org/licenses/MIT\n*\n* Designed and built with all the love in the world.\n*\n* Just typing Phone Number in shell to run it;\n* Everything will be done automatically :)\n*/\n'.yellow);
    console.log('进程守护已启动！\n'.magenta.bold);

    console.log('正在拉取登录表单，请稍后...');

    getLoginForm(function (loginForm) {
        if (!loginForm) {
            return;
        }
        curStatus.loginForm = loginForm;

        output.write('\n请输入11位手机号: '.cyan.bold);

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

            if (/[^\d]/g.test(text)) {
                console.log('手机号格式不正确！\n'.red.bold);
                output.write('请输入11位手机号: '.cyan.bold);
                return;
            }

            if (text.length !== 11) {
                console.log('手机号长度不对！\n'.red.bold);
                output.write('请输入11位手机号: '.cyan.bold);
                return;
            }

            curStatus.phone = parseInt(text, 10); // 存储手机号
            connect(); // 开始建立子进程
        });
    });
})();