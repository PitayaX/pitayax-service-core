{
    "version":"2.0.0",
    "arguments": {
        "arg1": {"default": 1, "type":"number"}
    },
    "parts": [
                {
                    "headers": ctx => {
                        return {
                            "h1": ctx.args.arg1,
                            "h2": "h2"
                        }
                    },

                    "beforePost": (ctx, data) => {
                        let headers = ctx.headers;
                        headers.h2 = 'hh2';
                    },

                    "body": (ctx, data) => {
                        return {
                            "col1": ctx.headers.h1,
                            "col2": ctx.headers.h2,
                            "col3": "v3"
                        }
                    }
                }
            ]
};
