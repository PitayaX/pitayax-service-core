'use strict'

let assert = require('assert')
let path = require('path')
let fs = require('fs')
let aq = require('../../').aq
let fake = require('../../').fake

let port = 1338
let testFile = path.join(__dirname, 'test.dat')
//console.log(testFile)
let fakedHTTP = new fake.http(port)

describe('aq', () => {

    before( () => fakedHTTP.start() )

    it('wrap value', done => {

        aq.Q(1)
            .then(data => {
                assert.equal(data, 1, 'test')
                done()
            })
            .catch(err => done(err))
    })

    it ('wrap error', done => {

        aq.Q(undefined, new Error('test'))
            .then(data => {throw new Error('failed')})
            .catch( err => {
                try {
                    assert.equal(err.message, 'test', 'catched error')
                    done()
                }
                catch(err) {
                    done(err)
                }
            })
    })

    it('wrap function', () => {

        var fn = aq.wrap(function* (val) {

            assert.equal(val, 6, 'invaild val')

            let r = []
            if (val >= 0) {
                for(let i = 0; i < val; i++){
                    let ri = yield aq.Q(i + 1)
                    r.push(ri)
                }
            }

            assert.deepEqual(r, [1, 2, 3, 4, 5, 6], 'Invaild length of return array.')

            return r
        })

        return fn(6)
    })

    it('call method', () => {
        let syncData = fs.readFileSync(testFile, 'utf-8')

        aq.call(fs, fs.readFile, testFile, 'utf-8')
            .then( data => {
                assert.equal(data, syncData, 'read file by call methods failed.')
                done()
            })
            .catch( err => done(err) )
    })

    it('apply method', () => {
        let syncData = fs.readFileSync(testFile, 'utf-8')

        aq.apply(fs, fs.readFile, [testFile, 'utf-8'])
            .then( data => {
                assert.equal(data, syncData, 'read file by apply methods failed.')
                done()
            })
            .catch( err => done(err) )
    })

    it('series method', () => {

        let q1 = [aq.Q(2), aq.Q(4), aq.Q(6)]

        aq.series(q1)
            .then(data => {
                assert.equal(data, 6, 'incorrect result for series mode.')
                done()
            })
            .catch(err => done(err))
    })

    it('parallel method', (done) => {

        let q1 = [aq.Q(2), aq.Q(4), aq.Q(6)]
        aq.parallel(q1)
            .then( (data) => {
                assert.deepEqual(data, [2, 4, 6], 'incorrect result for parallel mode.')
                done()
            })
            .catch(err => done(err))
    })

    it('rest method', (done) => {
        let url = 'http://127.0.0.1:' + port + '/?key1=val1&key2=val2'
        aq.rest(url)
            .then( data => {
                let result = {"key1":"val1", "key2":"val2"}
                assert.deepEqual(data, result, "Get data from http server error!")

                url = 'http://127.0.0.1:' + port + '/?key1=val1&key3=val3'
                return aq.rest(url)
            })
            .then( data => {

                let result = {"key1":"val1", "key3":"val3"}
                assert.deepEqual(data, result, "Get data from http server error!")
                done()
            })
            .catch( err => done(err) )
    })

    after( () => fakedHTTP.stop() )
})
