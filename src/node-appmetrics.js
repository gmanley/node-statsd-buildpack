const URL = require('url');
const StatsD = require('node-statsd');

const { STATSD_TAGS, APP_NAME, WORKER_NAME } = process.env;

const tags = (STATSD_TAGS || '').split(/,|\n/).filter(v => !!v);

function cleanUrl(value) {
    return (value || '')
        .replace(/[^a-z0-9-]/gi, '_')
        .replace(/^_+|_+$/, '');
}

if (APP_NAME)
    tags.push('service:' + APP_NAME);

if (WORKER_NAME && WORKER_NAME.split(/,|\n/g).length < 2) {
    tags.push('worker:' + WORKER_NAME);
} else if (WORKER_NAME) {
    // WORKER_NAME contains multiple workers
    // This means we are running the launcher and still starting up
    return;
}

const appmetrics = require('appmetrics');

// Inject custom appmetrics probes
require('./probes');

const metrics = appmetrics.monitor();
const statsd = new StatsD({
    globalize: true,
    host: process.env.STATSD_HOST,
    port: process.env.STATSD_PORT,
    prefix: process.env.STATSD_PREFIX,
    suffix: process.env.STATSD_SUFFIX,
    cacheDns: process.env.STATSD_CACHE_DNS,
    global_tags: tags
});

metrics.on('cpu', function handleCPU(cpu) {
    statsd.gauge('cpu.process', cpu.process);

    // This metric makes little sense on Heroku
    // statsd.gauge('cpu.system', cpu.system);
});

metrics.on('memory', function handleMem(memory) {
    statsd.gauge('memory.process.private', memory.private);
    statsd.gauge('memory.process.physical', memory.physical);
    statsd.gauge('memory.process.virtual', memory.virtual);

    // Host memory stats are not useful for us.
    // statsd.gauge('memory.system.used', memory.physical_used);
    // statsd.gauge('memory.system.free', memory.physical_free);
    // statsd.gauge('memory.system.total', memory.physical_total);
});

metrics.on('eventloop', function handleEventloop(eventloop) {
    statsd.gauge('eventloop.latency.min', eventloop.latency.min);
    statsd.gauge('eventloop.latency.max', eventloop.latency.max);
    statsd.gauge('eventloop.latency.avg', eventloop.latency.avg);
});

metrics.on('loop', function handleEventloopTick(loop) {
    statsd.gauge('eventloop.ticks.count', loop.count);
    statsd.timing('eventloop.ticks.min', loop.minimum);
    statsd.timing('eventloop.ticks.max', loop.maximum);
    statsd.timing('eventloop.ticks.avg', loop.average);
    statsd.gauge('eventloop.cpu_user', loop.cpu_user);
    statsd.gauge('eventloop.cpu_system', loop.cpu_system);
});

metrics.on('gc', function handleGC(gc) {
    statsd.gauge('gc.size', gc.size);
    statsd.gauge('gc.used', gc.used);
    statsd.timing('gc.duration', gc.duration);
});

metrics.on('http', function handleHTTP(http) {
    const method = http.method.toLowerCase();

    statsd.timing('http', http.duration);
    statsd.timing(`http.${method}`, http.duration);

    // Would create too many CloudWatch metrics
    // const url = URL.parse(http.url);
    // const path = cleanUrl(url.pathname);
    // statsd.timing(`http.${method}.${path}`, http.duration);
});

/*
 * Disabled for now since this generates duplicate metrics
 * under the 'http' metric as well.
metrics.on('https', function handleHTTPS(https) {
    const url = URL.parse(https.url);
    const method = https.method.toLowerCase();
    const path = cleanUrl(url.pathname);

    statsd.timing('https', https.duration);
    statsd.timing(`https.${method}`, https.duration);
    statsd.timing(`https.${method}.${path}`, https.duration);
});
*/

metrics.on('http-outbound', function handleOutbound(http) {
    const url = URL.parse(http.url);
    const domain = cleanUrl(url.hostname);

    statsd.timing('fetch.http', http.duration);
    statsd.timing(`fetch.http.${domain}`, http.duration);
});

/*
 * Disabled for now since this generates duplicate metrics
 * under the 'http-outbound' metric as well.
metrics.on('https-outbound', function handleOutbound(https) {
    const url = URL.parse(https.url);
    const domain = cleanUrl(url.hostname);

    statsd.timing('fetch.https', https.duration);
    statsd.timing(`fetch.https.${domain}`, https.duration);
});
*/

const TABLE_REGEX = /(FROM|UPDATE|INSERT INTO)\s*`?([^\s`]+)`?/i;
metrics.on('mysql', function handleMySQL(mysql) {
    const type = (mysql.query.split(' ').shift() || '').toLowerCase();
    const table = (TABLE_REGEX.exec(mysql.query || '') || [])[1];

    statsd.timing('mysql', mysql.duration);

    if (type)
        statsd.timing(`mysql.${type}`, mysql.duration);

    if (type && table)
        statsd.timing(`mysql.${type}.${table}`, mysql.duration);
});

metrics.on('redis', function handleRedis(redis) {
    statsd.timing('redis.' + redis.cmd, redis.duration);
});
