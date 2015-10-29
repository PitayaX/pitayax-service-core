{
    "version": "2.0.0",
    "parts": [
                {
                    "action": "mongo",
                    "headers": {"name":"post","method":"retrieve", "options":{"method": "findOne"}},
                    "body": {"title":"changed title"}
                },
                {
                    "action": "rest",
                    "headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}
                },
                {
                    "action": "directly",
                    "body": {"k1":"v1"}
                }
            ],
    //"after": (ctx, data) => [data[0]._id, data[1].data2, data[2].k1]
}
