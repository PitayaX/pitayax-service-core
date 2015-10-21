{
    "type": "report",
    "version":"2.0.0",
    "hash":"",
    "arguments": {
        "arg1": "string",
        "arg2": {
            "type": "number",
            "default": 1
        }
    },
    "beforeEach": function(ctx){
    },
    "parts":[
        {
            "before": function(ctx) {
                ctx['test'] = '123';
            },
            "headers":{
                "type": "query",
                "key1": "value1",
                "key2": "value2",
                "key3": "value3"
            },
            "body": {
                "$query": {"a": `\"$arg1\"`}
            },
            "parts":[
                {
                    "body":{"$query": {"a": `\"$arg1\"`}}
                }
            ],
            "after": function(ctx, data) {
                //get data
                Object.keys(ctx.headers).forEach(header => {
                    console.log(header + ': ' + ctx.headers[header]);
                });

                let v1 = ctx['test'];
                //console.log('ctx:' + ctx['test'])
                return data;
            }
        },
        {
            "body":{
                "$type": "query",
                "$query": {}
            }
        }
    ],
};
