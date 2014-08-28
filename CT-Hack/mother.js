/*
 * Mother Processing
 */
console.log('\u001b[33m/*!\n* ChinaNet Portal Hacking v0.1.0 by Dolphin @BUCT_SNC_SYS.\n* Copyright 2014 Dolphin Wood.\n* Licensed under http://opensource.org/licenses/MIT\n*\n* Designed and built with all the love in the world.\n*\n* Just typing Phone Number in shell to run it;\n* Everything will be done automatically :)\n*/\n\u001b[39m' /* yellow */ );
console.log('\u001b[1m\u001b[35m进程守护已启动！\n\u001b[39m\u001b[22m' /* cyan */ );

var child = require('child_process');
var input = process.stdin;
var output = process.stdout;
var curStatus = {
    phone: undefined,
    crashed: false
}

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
        output.write('\u001b[35m\u001b[1m\n检测到主进程退出！\u001b[22m\u001b[39m\n是否重启进程（Y/N）');
        input.resume(); // 恢复输入监听
    }).on('message', function (phone) {
        // 同步手机号
        curStatus.phone = phone;
    }).send(curStatus);
};

(function (connect) {
    // 获取输入值
    input.resume();
    input.setEncoding('utf8');
    output.write('\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m' /* cyan */ );
    input.on('data', function (text) {
        text = text.trim();
        if (curStatus.crashed) {
            // 进程中断
            var T = text.toUpperCase();
            if (T === "Y") {
                console.log('\u001b[33m\u001b[1m\n正在重启主进程...\u001b[22m\u001b[39m');
                input.pause();
                return connect(); // 重启进程
            } else if (T === "N") {
                process.exit();
            } else {
                return output.write('\n是否重启进程（Y/N）：');
            }
        }

        if (text.length !== 11) {
            return output.write('\u001b[31m\u001b[1m手机号长度不对！\u001b[22m\u001b[39m\n\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m');
        }

        if (/[^\d]/g.test(text)) {
            return output.write('\u001b[31m\u001b[1m手机号格式不正确！\u001b[22m\u001b[39m\n\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m');
        }

        curStatus.phone = parseInt(text, 10); // 存储手机号
        connect(); // 开始建立子进程
    })
})(connect);