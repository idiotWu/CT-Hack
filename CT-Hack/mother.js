/*
 * Mother Processing
 */
console.log('\u001b[33m/*!\n* ChinaNet Portal Hacking v0.0.4 by Dolphin @BUCT_SNC_SYS.\n* Copyright 2014 Dolphin Wood.\n* Licensed under http://opensource.org/licenses/MIT\n*\n* Designed and built with all the love in the world.\n*\n* Just typing Phone Number in shell to run it;\n* Everything will be done automatically :)\n*/\n进程\n\u001b[39m' /* yellow */ );
console.log('\u001b[1m\u001b[35m进程守护已启动！\n\u001b[39m\u001b[22m' /* cyan */ );
var status = {
    phone: undefined,
    crashed: false
}
var child = require('child_process');
var input = process.stdin;
var output = process.stdout;

function io() {
    // 获取输入值
    input.resume();
    input.setEncoding('utf8');
    output.write('\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m' /* cyan */ );
    input.on('data', function(text) {
        text = text.trim();
        if (status.crashed) {
            // 进程中断
            if (text.toUpperCase() === "Y") {
                console.log('\u001b[33m\u001b[1m\n正在重启主进程...\u001b[22m\u001b[39m');
                status.phone++;
                clearTimeout(restart); // 清空计时器
                return start(), input.pause(); // 重启进程
            } else
                process.exit();
        }
        if (text.length !== 11)
            return console.log('\u001b[31m\u001b[1m手机号长度不对！\u001b[22m\u001b[39m\n' /* red */ ), output.write('\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m');
        if (/[^\d]/g.test(text))
            return console.log('\u001b[31m\u001b[1m手机号格式不正确！\u001b[22m\u001b[39m\n'), output.write('\u001b[36m\u001b[1m请输入11位手机号: \u001b[22m\u001b[39m');
        status.phone = parseInt(text, 10); // 存储手机号
        start(); // 开始建立子进程
        input.pause();
    })
}

function start() {
    hack = child.fork('./main.js');
    hack.on('data', function(data) {
        // 同步输出
        console.log(data);
    }).on('message', function(phone) {
        // 同步手机号
        status.phone = phone;
        status.crashed = false;
    }).on('exit', function() {
        delete hack;
        status.crashed = true;
        output.write('\u001b[35m\u001b[1m\n检测到主进程退出！\u001b[22m\u001b[39m\n是否重启进程（Y/N）\u001b[90m\u001b[1m 3s 后自动重启\u001b[22m\u001b[39m：');
        restart = setTimeout(start, 3000);
        input.resume(); // 恢复输入监听
    }).send(status);
}

io();
