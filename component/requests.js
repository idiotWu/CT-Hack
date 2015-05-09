/**
 * @date     2015/5/9
 * @author   Dolphin<dolphin.w.e@gmail.com>
 *
 * Request URLs
 */

'use strict';

var scopedClient = require('scoped-http-client');

var basic = 'http://wifi.189.cn';

var createCli = function (options) {
    var cli = scopedClient
        .create(options.url || basic)
        .timeout(3e4);

    return options.path ? cli.path(options.path) : cli;
};

var reqs = {
    ping: {
        url: 'http://www.baidu.com'
    },
    start: {
        path: '/service/index.jsp'
    },
    addGood: {
        path: '/service/cart.do'
    },
    list: {
        path: '/service/cart.do'
    },
    getOrder: {
        path: '/service/user.do'
    },
    getPwd: {
        path: '/clientApi.do'
    }
};

for (var type in reqs) {
    reqs[type] = createCli(reqs[type]);
}

reqs.addGood.query({
    method: 'addGood',
    confirm: 'yes',
    cardId: 1,
    type: 1,
    count: 1
});

reqs.list.query({
    method: 'list'
});

reqs.getOrder.query({
    method: 'buy',
    confirm: 'yes',
    shopCartFlag: 'shopCart',
    cardType: 1,
    cardPayType: 'yi',
    user_phone: '',
    smsVerifyCode: '',
    isBenJi: 'no'
});

reqs.getPwd.query({
    method: 'get10mCard'
});

module.exports = reqs;