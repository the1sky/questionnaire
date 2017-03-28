/**
 * Created by nant on 16/9/8.
 */
var imgUrl = 'images/share.jpeg';
var lineLink = window.location.href;
var descContent = "两只熊问券调查";
var shareTitle = '测试你的钓鱼级别，新手、大师一测就知道。。';
var appid = '';

function shareFriend() {
  WeixinJSBridge.invoke('sendAppMessage', {
    "appid": appid,
    "img_url": imgUrl,
    "img_width": "640",
    "img_height": "640",
    "link": lineLink,
    "desc": descContent,
    "title": shareTitle
  }, function (res) {
  })
}
function shareTimeline() {
  alert('timeline');
  WeixinJSBridge.invoke('shareTimeline', {
    "img_url": imgUrl,
    "img_width": "640",
    "img_height": "640",
    "link": lineLink,
    "desc": descContent,
    "title": shareTitle
  }, function (res) {
  });
}
// 当微信内置浏览器完成内部初始化后会触发WeixinJSBridgeReady事件。
document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
  // 发送给好友
  WeixinJSBridge.on('menu:share:appmessage', function (argv) {
    shareFriend();
  });

  // 分享到朋友圈
  WeixinJSBridge.on('menu:share:timeline', function (argv) {
    shareTimeline();
  });
}, false);