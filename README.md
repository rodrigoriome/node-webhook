# node-webhook

The endpoint for all endpoints.

### Usage

1. Install the package

```
npm i -g @rodrigoriome/node-webhook
```

2. Create a file containing the JSON configuration:

```
// hooks.json

{
  // Enable autocomplete for IDEs that support JSON Schema.
  "$schema": "https://git.io/JsEja",

  // Define in which port it'll be listened. Defult: 3500
  "port": 3500,

  // Define multiple endpoints in one configuration.
  "hooks": [
    {
      "slug": "endpoint-a",

      // Forward incoming headers. These 2 are forwarded by default.
      "forward": {
        "headers": [
          "content-type",
          "content-length"
        ]
      },

      // Distribute the incoming request to other endpoints.
      "callbacks": [
        {
          "type": "request",
          "endpoint": "http://reload.cibccm.dps.sh/storyblok"
        },
        {
          "type": "request",
          "endpoint": "http://52.139.89.237:5000/storyblok"
        },
      ]
    },
  ]
}
```

3. Run the executable passing the config file as parameter

```
node-webhook hooks.json
```
