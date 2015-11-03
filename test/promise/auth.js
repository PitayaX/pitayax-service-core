'use strict'

const aq = require('../../').aq

const url = "http://10.10.73.28:8001/auth?response_type=code&client_id=Blog&state=xyz%20&redirect_uri=http://localhost:3000/cb/login"
const postUrl = "http://10.10.73.28:8001/token"
const body = {}

body["code"] = "73c78d01-cc05-47c5-af91-250f8cfff936"
body["grant_type"] = "authorization_code"
body["client_id"] = "Blog"
body["redirect_uri"] = "http://localhost:3000/cb/login"

aq.rest(postUrl, 'post', {}, JSON.stringify(body))
  .then( data => {
    let access_token = data.access_token
    let body2 = {}
    body2["authorization"] = access_token
    body2["client"] = "Blog"

    //const feedUrl = `http://10.10.73.28:8001/feed?authorization=${access_token}&client_id=BLog`
    const feedUrl = `http://10.10.73.28:8001/feed`
    const headers = {}
    headers["authorization"] = access_token
    headers["client"] = "Blog"

    return aq.rest('http://10.10.73.28:8001/feed','GET' , headers)
  })
  .then( data => {
    console.log(data)
  })
  .catch( err => {
    console.log(`err: ${err.message}`)
  })
