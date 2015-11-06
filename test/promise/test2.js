'use strict'

const aq = require('../../').aq

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

aq.parallel([
  aq.rest('http://10.10.73.207:8088/api/post/5639991d528373183cb64039', 'GET', {"access_token":'243433'}),
  aq.rest('http://10.10.73.207:8088/api/post/55fbb036f19aa4c866e80b52', 'GET', {})
])
.then( data => {
  console.log(data)
})
