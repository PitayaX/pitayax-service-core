'use strict'

const aq = require('../../').aq

aq.rest(
  'http://120.24.58.42:2001/token',
  'POST',
  {},
  {
    "refresh_token": "499049c6-f151-4751-bd7d-0f8d3edccecc",
    "grant_type": "refresh_token"
  })
  .then( data => {
    console.log('got')
    console.log(data)
  })
  .catch( err => {
    console.log('err')
    console.log(err)
    console.log('end')
  })

/*
aq.rest('http://10.10.73.207:8088/api/post/5639991d528373183cb64039', 'GET', {})
  .then( data => {
    console.log(data)
  })

aq.rest('http://10.10.73.207:8088/api/post/55fbb036f19aa4c866e80b52', 'GET', {})
  .then( data => {
    console.log(data)
  })
  */

/*
aq.parallel([
  aq.rest('http://10.10.73.207:8088/api/post/5639991d528373183cb64039', 'GET', {"access_token":'243433'}),
  aq.rest('http://10.10.73.207:8088/api/post/55fbb036f19aa4c866e80b52', 'GET', {})
])
.then( data => {
  console.log(data)
})
*/
