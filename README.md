# 免账号登录 ChinaNet 热点 #

[![NPM](https://nodei.co/npm/ct-hack.png)](https://nodei.co/npm/ct-hack/)

## 安装 ##

`npm install -g ct-hack`

## 用法 ##

1. 连接上 ChinaNet 无线网
2. 运行 `ct-hack`
3. 等待连接成功

## 提示 ##

1. 由于是模拟天翼 WiFi 客户端进行登录，理论上应该不受区域限制。
2. 可能出现第一次登录失败的情况，脚本会在**一秒后**执行第二次登录尝试，**两次登录都失败则进行下一组计算**。
3. **九分半**后注销登录，并进行下一次计算。

## 原理 ##

1. 利用每次申请购买时长卡会得到**十分钟**的连接时间，通过 node.js 模拟购买流程，自动获得账号密码。
2. 利用所得到的帐密，模拟天翼 WiFi 客户端登录过程，达到联网的目的。

![](http://i.imgur.com/euGAGLq.png)

## License ##

MIT Licensed.
