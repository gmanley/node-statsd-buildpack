# node-statsd-buildpack

Heroku buildpack that automatically runs [gostatsd](https://github.com/atlassian/gostatsd) and preloads all node instances with an [appmetrics](https://github.com/RuntimeTools/appmetrics) instance loaded to push metrics to `StatsD` (gostatsd).

# Usage

- Ensure your project has a `package.json` in the root of the project
- Add [this repository as a buildpack](https://github.com/ambassify/node-statsd-buildpack) for your project on Heroku or through `app.json` alongside the [node buildpack](https://elements.heroku.com/buildpacks/heroku/heroku-buildpack-nodejs).
- Set the `STATSD_ENABLED` environment variable to `1`
- If using the default `cloudwatch` backend, configure `STATSD_AWS_ACCESS_KEY_ID` and `STATSD_AWS_SECRET_ACCESS_KEY` environment variables.
- If using a different backend as `cloudwatch`, configure `STATSD_BACKEND` environment variable.
- Redeploy your project onto Heroku

## Environment Variables

| Environment variable | Default | Description |
| --- | --- | --- |
| `STATSD_AWS_ACCESS_KEY_ID` | `AWS_ACCESS_KEY_ID` | The AWS credentials used by `gostatsd` |
| `STATSD_AWS_SECRET_ACCESS_KEY` | `AWS_SECRET_ACCESS_KEY` | The AWS credentials used by `gostatsd` |
| `STATSD_BACKEND` | `cloudwatch` | The metrics backend used by statsd |
| `STATSD_ENABLED` | false | Controls whether to start `gostatsd` and preload `appmetrics` |
| `STATSD_TAGS` | null | `APP_NAME` will be set as `service:$APP_NAME`, `WORKER_NAME` will be set as `worker:$WORKER_NAME` |
| `STATSD_OPTS` | `--flush-interval 30s` | Controls how often `gostatsd` pushes metrics to the backend |

## Config file

If a `.statsd.toml` file is found at the root of your project it will be used as the configuration file for `gostatsd`.

If not such file has been found [the default config](https://github.com/ambassify/node-statsd-buildpack/blob/master/config.default.toml) is injected.

## Sending custom metrics

You can either use any `npm` package, such as [node-statsd](https://www.npmjs.com/package/node-statsd), to send metrics to the locally running `statsd` (gostatsd).

Alternatively the `node-statsd` instance used by `appmetrics` is exported as the `statsd` global which you can use anywhere in your code while `STATSD_ENABLED` is true and the buildpack is in use.

# Components

## gostatsd

Currently this repository contains the `gostatsd` binary in the `binaries` folder since there is no source available to download pre-compiled binaries at this time.

## Appmetrics

This buildpack contains custom probes for `ioredis` and `mysql2` which are slightly modified versions of the `redis` and `mysql` probes in the appmetrics repository.

Additional probes might be added in `src/probes` of this buildpack.

## Contributing

If you have some issue or code you would like to add, feel free to open a Pull Request or Issue and we will look into it as soon as we can.

## License

We are releasing this under a MIT License.

## About us

If you would like to know more about us, be sure to have a look at [our website](https://www.ambassify.com), or our Twitter accounts [@Ambassify](https://twitter.com/Ambassify), [Sitebase](https://twitter.com/Sitebase), [JorgenEvens](https://twitter.com/JorgenEvens)
