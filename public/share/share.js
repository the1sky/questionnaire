/**
 * Created by nant on 16/9/8.
 */
var shareObj = {
  imgUrl: window.location.origin + '/images/share.jpeg',
  link: window.location.href,
  desc: '两只熊问券调查',
  title: '测试你的钓鱼级别，新手、大师一测就知道。。',
};

wx.config({
  debug: false,
  appId: appId,
  timestamp: timestamp,
  nonceStr: nonceStr,
  signature: signature,
  jsApiList: [
    'onMenuShareTimeline',
    'onMenuShareAppMessage'
  ] // 必填，需要使用的JS接口列表，
});

wx.ready(function () {
  wx.onMenuShareAppMessage({
    title: shareObj.desc,
    desc: shareObj.title,
    link: shareObj.link,
    imgUrl: shareObj.imgUrl,
    trigger: function (res) {
    },
    success: function (res) {
    },
    cancel: function (res) {
    },
    fail: function (res) {
      alert(JSON.stringify(res));
    }
  });

  wx.onMenuShareTimeline({
    title: shareObj.title,
    link: shareObj.link,
    imgUrl: shareObj.imgUrl,
    success: function () {
    },
    cancel: function () {
    }
  });
});

wx.error(function (res) {
  JSON.stringify(res)
});