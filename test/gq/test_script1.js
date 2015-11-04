{
    "version":"2.0.0",
    "arguments": {
        "arg1": "string",
        "arg2": "number"
    },
    "parts": {
            "body": function(ctx) {
                let args = ctx.args;
                return {
                    "result": "t",
                    "data": args.arg1
                }
            }
    }
}
