// var app = require('express')();
var session = require('express-session');
var CASAuthentication = require('cas-authentication');
var axios = require('axios').create()
var cookie = require('cookie-parser');

exports.initCas = function (app, uri) {

// Set up an Express session, which is required for CASAuthentication.
  app.use(cookie())
  app.use(session({
    secret: 'super secret key',
    resave: false,
    saveUninitialized: true
  }));

// Create a new instance of CASAuthentication.
  var cas = new CASAuthentication({
    cas_url: 'http://uat.hengtech.com.cn/sso',
    service_url: uri,
    cas_version: '2.0',
    session_info: 'attributes',
    renew: false
  });

  //登录拦截器
  app.use(function (req, res, next) {
    var url = req.originalUrl;
    // console.info('req.originalUrl', req.originalUrl)
    if (url.indexOf('/login') !== 0 && !req.session[cas.session_name]) {
      console.info('用户未登录，转到登录界面')
      req.session['originalUrl'] = url
      return res.redirect("/login");
    } else {
      // 在拦截器添加 header
      // let casUser = req.session['casUser']
      // req.header('Authorization-Access-Token','pms 64a9f747-f5f3-4edb-a13a-958e09c7ffb5')
      // req.header('Authorization-Access-User',casUser.userId)
      // req.header('current-user-json-encode',encodeURI(JSON.stringify(fakeUser)))
    }
    next();
  });

// Unauthenticated clients will be redirected to the CAS login and then back to
// this route once authenticated.
  app.get('/login', cas.bounce, function (req, res) {
    // console.info('/login req.originalUrl=', req.originalUrl)
    let url = req.session['originalUrl']
    console.info('登录前的原始url=>', url)
    initCasUserPromise(req.session).then((data) => {
      res.cookie('casUser', JSON.stringify(data));
      if (url) {
        req.session['originalUrl'] = null
        res.redirect(url);
      } else {
        res.redirect('/')
      }
    })
  });

// Unauthenticated clients will receive a 401 Unauthorized response instead of
// the JSON data.
  app.get('/api', cas.block, function (req, res) {
    res.json(req.session['attributes']);
  });

  function initCasUserPromise(session) {
    return new Promise((resolve, reject) => {
      let casUser = session['casUser']
      if (casUser) {
        resolve(casUser)
      } else {
        let sessionUser = session['attributes']
        let wrapUser = {}
        // 下划线转驼峰
        for (let key in sessionUser) {
          let key2 = key.replace(/_(\w)/g, function (all, letter) {
            return letter.toUpperCase();
          });
          wrapUser[key2] = sessionUser[key]
        }
        // 获取bizId
        let param = {
          tranCode: 1801,
          bizContent: {
            regId: wrapUser.orgId,
            type: 1
          }
        }
        axios.post('https://uat.hengtech.com.cn/pmsSrv/api/api!gateway.action', param)
          .then(respon => {
            wrapUser.bizId = respon.data.bizContent.respId
            // console.info(JSON.stringify(wrapUser))
            session['casUser'] = wrapUser
            resolve(wrapUser)
          })
          .catch(e => {
            // console.error(e)
            reject(e)
          })
      }
    })
  }

// An example of accessing the CAS user session variable. This could be used to
// retrieve your own local user records based on authenticated CAS username.
  app.get('/userInfo', cas.block, function (req, res) {
    initCasUserPromise(req.session)
      .then(data => {
        // console.info('/cas/user',data)
        res.json(data)
      })
      .catch(e => {
        // console.info('/cas/user  error',e)
        res.sendStatus(500)
      })
  });

// Unauthenticated clients will be redirected to the CAS login and then to the
// provided "redirectTo" query parameter once authenticated.
  app.get('/authenticate', cas.bounce_redirect);

// This route will de-authenticate the client with the Express server and then
// redirect the client to the CAS logout page.
  app.get('/logout', cas.logout, function (req, res) {
    res.cookie('casUser', null)
  });

  // app.get('/**', cas.bounce, function (req, res) {
  // //   console.info('req.path',req.path)
  //   res.redirect(req.path)
  //   // for(let key in res){
  // //   //   console.info('key=%s value=%s',key,res[key])
  //   // }
  //   // res.send('<html><body>Hello wefwefe!</body></html>');
  // });
}

// app.listen(3000)
//
// module.export={
//   initCas:initCas
// }
