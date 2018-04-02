/**
 * winston-datadog
 * @imports http
 * @imports https
 */

"use strict";

const hostname = require('os').hostname();
const util = require('util');
const format = util.format;
const qs = require('querystring');

class Transport { //jshint ignore:line
    /**
     * @constructor Transport
     * @params {object} credentials
     * @example
     * new Transport({
     *   api_key: ...,
     *   app_key: ...
     * });
     */
    constructor(credentials) {
        var api = this;
        var paths = Transport.API_ENDPOINT.split('/').filter(Boolean);
        api.name = 'Datadog';
        api.attachResults = false;
        //set to true to force transport to use text in place of the title
        api.useTextAsTitle = false;
        api.requestOptions = {
            port: paths[0] === 'https:' ? 443 : 80,
            hostname: paths[1],
            path: format('/%s/v%d/events?%s',
                    paths[2],
                    Transport.API_VERSION,
                    qs.stringify(credentials)),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        var protocol = api.requestOptions.port === 443 ? require('https') : require('http');
        api.request = protocol.request;
        api.options = new api.Options();
    }

    /**
     * Sets the winston logger to use for DatadogResult event
     */
    receiveResults(logger) {
        var api = this;
        api.attachResults = true;
        if (logger) {
            api.logger = logger;
        }
    }

    /**
     * Sets the winston logger to use for DatadogResult event
     */
    stopResults() {
       this.attachResults = false;
    }

    /**
     * Sets the winston logger to use for DatadogResult event
     */
    resetOptions() {
       var api = this;
       api.options = new api.Options();
    }

    /**
     * Log events from winston
     */
    log(loglevel, text, data, callback) {
        var api = this;
        if (api.loglevels[loglevel]) {
            loglevel = api.loglevels[loglevel];
        }
        var req = api.request(api.requestOptions, (res) => {
            var data = '';
            res.on('data', (buffer) => {
                data += buffer;
            });
            res.on('end', () => {
                if (api.attachResults) {
                    res.body = JSON.parse(data);
                    api.logger.emit.call(api.logger, 'DatadogResult', res);
                }
                callback();
            });
        });
        var opts = api.options;
        opts.alert_type = loglevel;

        if (api.useTextAsTitle) {
            opts.title = text;
        }

        var aggregation_key;
        if (data && data.aggregation_key) aggregation_key = data.aggregation_key;

        //efficient way to check if object is empty or error
        if (data instanceof Error) {
            opts.text = text + (text.length ? ' | ' + data.stack : data.stack);
        } else {
            var prop;
            var dataCopy = Object.assign({}, data);
            delete dataCopy.aggregation_key;
            for (prop in dataCopy) {
                opts.text = text + (text.length ? ' | ' + JSON.stringify(dataCopy) : JSON.stringify(dataCopy));
                break;
            }
        }
        if (!opts.text) {
            opts.text = text;
        }
        if (opts.text.length > 4000) {
            opts.text = opts.text.substr(0, 4000);
        }
        // override aggregation_key with version passed as param (if set)
        req.write(JSON.stringify(Object.assign({ aggregation_key: aggregation_key }, opts)));
        req.end();
        opts.text = null;
        delete opts.text;
    }
}

Transport.API_VERSION = 1;
Transport.API_ENDPOINT = 'https://app.datadoghq.com/api/';
/**
 * overrides for winston logging levels
 */
Transport.prototype.loglevels = {
    silly: 'info',
    debug: 'info',
    verbose: 'info',
    warn: 'warning'
};

/**
 * Exposes endpoint options for Data-Dog
 * @const
 */
class TransportOptions {
    constructor() {
        var opts = this;
        return {
            title: opts.title,
            priority: opts.priority,
            date_happened: opts.date_happened,
            host: opts.host,
            tags: opts.tags.slice(0),
            alert_type: opts.alert_type,
            aggregation_key: opts.aggregation_key,
            source_type_name: opts.source_type_name
        };
    }
}
TransportOptions.prototype.title = 'LOG';
TransportOptions.prototype.priority = 'normal'; // or low
TransportOptions.prototype.date_happened = null;
TransportOptions.prototype.host = hostname;
TransportOptions.prototype.tags = [
    'env:' + (process.env.NODE_ENV || 'local')
];
TransportOptions.prototype.alert_type = 'info'; // or error; warning; success
TransportOptions.prototype.aggregation_key = null; //arbitrary value
TransportOptions.prototype.source_type_name = null; // options = nagios; hudson; jenkins; user; my apps; feed; chef; puppet; git; bitbucket; fabric; capistrano

//expose Transport options
Transport.prototype.Options = TransportOptions;

module.exports = Transport;
