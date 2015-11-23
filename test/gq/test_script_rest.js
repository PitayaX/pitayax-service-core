{
  "version": "2.0.0",
  "action": "rest",
  "before": ctx => {
      ctx.global.output = false;
  },
  "parts": [
    {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`}}},
    {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}},
    //{"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`d}}}
    {
      "headers": function(ctx){
        return {
            "url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`,
            "method": "GET",
            "headers": {}
        };
      },
      "body": {},
      "action": "rest",
      "parts": [
        {
          "before": (ctx, data) => {
            if (ctx.global.output) console.log('ctx in child before: ' + JSON.stringify(ctx));
            ctx.global.result3 = data;  //catch data from previous step

            return data;
          },
          "headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data4=val4`}},
          "after": (ctx, data) => {
            if (ctx.global.output) console.log('ctx in child after: ' + JSON.stringify(ctx));
            return (ctx.global.result3) ? ctx.global.result3 : data;
          }
        }
      ],
      "after": (ctx, data) => {
        if (ctx.global.output) console.log('ctx in part: ' + JSON.stringify(ctx));
        ctx.global.test = 'temp';

        return data;
      }
    }
  ],
  "after": (ctx, data) => {
    if (ctx.global.output) console.log('ctx in global: ' + JSON.stringify(ctx));

    let newData = {}
    if (ctx.global.output) console.log('original: ' + JSON.stringify(data));
    data.forEach(item => Object.keys(item).forEach(key => newData[key] = item[key]))
    if (ctx.global.output) console.log('new: ' + JSON.stringify(newData));
    return data;
  }
}
