{
    "version":"2.0.0",
    "arguments": {
        "arg1": "string",
        "arg2": "date",
        "arg3": "number"
    },
    "parts": {
            "body": function(ctx) {

                let args = ctx.args;
                return {
                    "data1": args.arg1,
                    "data2": "fixed",
                    "data3": args.arg3,
                }
            }
    }
};
