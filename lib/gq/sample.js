{
    "type": "report",
    "version":"2.0.0",
    "arguments": {
        "arg1": {
            "default": 1,
            "type": "number"
        },
        "arg2": {
            "default": "abc",
            "type": "string"
        },
        "arg3": {
            "default": [1, 2, 3],
            "type": "array(number)"
        }
    },
    "beforeEach": function(args) {return args;}
    "parts":[
        {
            "cache":{
                "policy": "none",
                "timeout": 2000
            },
            "before": function(args) {
                return args;
            },
            "body": {
                "$query": {}
            },
            "after": function(data) {
                return data;
            }
        },
        {
            "body": {
                "$query": {}
            }
        }
    ],
    "afterEach": function(datas){
        return datas;
    }
};
