{
    "version": "2.0.0",
    "action": "rest",
    "parts": [
                {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`}}},
                {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}},
                {
                    "headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`}},
                    "parts": {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data4=val4`}}}
                }
            ]
}
