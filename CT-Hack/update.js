var version = '0.2.0';
var url = 'https://github.com/idiotWu/CT-Hack/releases';
var input = process.stdin;
var output = process.stdout;

var https = require('https');
var open = require('./node_modules/open');
var cherrio = require('./node_modules/cheerio');

var isNeedUpdate = function (latest) {
    // 版本号检测
    var latestV = latest.split('.');
    var curV = version.split('.');
    for (var i = 0, max = curV.length; i < max; i++) {
        if (latestV[i] > curV[i]) {
            return true;
        }
    }
    return false;
};

(function () {
    input.resume();
    output.write('当前版本： ' + version);
    output.write('\n\nGithub 上最新版本：');
    https.get(url, function (res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        }).on('end', function () {
            // 获取 Github 上最新版本号
            var $ = cherrio.load(data);
            var latest = $('.release-title:first-child').text().match(/\d.*\d/g)[0];

            output.write(latest);

            if (isNeedUpdate(latest)) {
                output.write('\n\n存在更新版本，是否更新（Y/N）：');
                input.setEncoding('utf8');
                input.on('data', function (text) {
                    text = text.trim().toUpperCase();
                    if (text === 'Y') {
                        open(url);
                        input.pause();
                    } else if (text === 'N') {
                        process.exit();
                    } else {
                        output.write('\n\n存在更新版本，是否更新（Y/N）：');
                    }
                });
            } else {
                console.log('\n\n没有更新版本！');
            }
        });
    }).on('error', function (e) {
        console.log('请求出错: ' + e.message + ',请检查网络连接\n');
    });
})();