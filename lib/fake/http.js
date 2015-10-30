'use strict'

let http = require('http')
let querystring = require('querystring')
let url = require('url')

class FakedServer
{
    constructor(port)
    {
        this.server = this.createServer()
        this.port = port
    }

    createServer()
    {
        return http.createServer(
                        (req, res) => {
                            res.writeHead(200, {'Content-Type': 'application/json'})

                            let u = url.parse(req.url)
                            if (u.query) {
                                let data = querystring.parse(u.query)

                                res.write(JSON.stringify(data))
                            }

                            res.end()
                        })
    }

    start()
    {
        if (this.server != undefined) {
            try{
                this.server.listen(this.port)
            }
            catch(err){
                console.log('failed: ' + err.message)
            }
        }
    }

    stop()
    {
        if (this.server != undefined) {
            this.server.close()
        }
    }
}

/*
let fakedServer = new FakedHTTP(1337)
fakedServer.start()
*/

module.exports = FakedServer
