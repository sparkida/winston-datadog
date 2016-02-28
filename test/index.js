const dotenv = require('dotenv');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const assert = require('assert');
const Transport = require('../');
const winston = require('winston');

describe('Transport', () => {
    var ddTransport;
    var logger;
    before(() => {
        assert(dotenv.load({path: envPath}));
        ddTransport = new Transport({
            api_key: process.env.DD_API_KEY,
            app_key: process.env.DD_APPLICATION_KEY
        });
        logger = new winston.Logger({
            transports: [
                ddTransport
            ]
        });
        ddTransport.receiveResults(logger);
    });

    it ('should load test/.env', () => {
        assert(!!process.env.DD_API_KEY);
        assert(!!process.env.DD_APPLICATION_KEY);
    });

    it ('should be able to send error level with Error objects', (done) => {
        logger.once('DatadogResult', (res) => {
            assert.equal(res.body.status, 'ok');
            assert(res.body.event);
            done();
        });
        logger.log('error', new Error('Server broke!'));
        //logger.log('error', {someObject: 'of things', asd:124125});
    });

    it ('should be able to send warn level with Object data', (done) => {
        var data = {foo: 'bar', bar: 'baz'};
        var jsonData = JSON.stringify(data);

        logger.once('DatadogResult', (res) => {
            assert.equal(res.body.status, 'ok');
            assert(res.body.event);
            assert.equal(res.body.event.text, jsonData);
            done();
        });
        logger.log('warn', data);
    });
   
    it ('should be able to send text and Object data', (done) => {
        var data = {foo: 'bar', bar: 'baz'};
        var jsonData = JSON.stringify(data);
        var text = 'Something really awesome.';

        logger.once('DatadogResult', (res) => {
            assert.equal(res.body.status, 'ok');
            assert(res.body.event);
            assert.equal(res.body.event.text, text + ' | ' + jsonData);
            done();
        });
        logger.log('info', text, data);
    });
    
    it ('should disable the receiver', function (done) {
        logger.once('DatadogResult', (res) => {
            done(new Error('data receieved'));
        });
        ddTransport.stopResults();
        logger.on('logging', () => {
            setTimeout(done, 1000);
        });
        logger.log('info', 'foo');
    });
});
