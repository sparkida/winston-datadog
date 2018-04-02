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

    afterEach(() => {
        delete ddTransport.options.aggregation_key;
    });

    it('should load test/.env', () => {
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
   
    it ('should be able to send text data', (done) => {
        var text = 'Something really awesome.';
        logger.once('DatadogResult', res => {
            assert.equal(res.body.status, 'ok');
            assert(res.body.event);
            assert.equal(res.body.event.text, text);
            done();
        });
        logger.log('info', text);
    });
    
  it('should be able to set aggregation_key on log', done => {
    var text = 'Something aggregated.';
    logger.once('DatadogResult', res => {
      assert.equal(res.body.status, 'ok');
      assert(res.body.event);
      assert.equal(res.body.event.text, text);
      done();
    });
    logger.log('info', text, { aggregation_key: '123' });
  });
    
  it('should be able to override transport aggregation_key on log', done => {
    var text = 'Something aggregated, without changing the default key.';
    var transportAggregationKey = 'tag';
    logger.once('DatadogResult', res => {
      assert.deepStrictEqual(
        ddTransport.options.aggregation_key,
        transportAggregationKey
      );
      assert.equal(res.body.status, 'ok');
      assert(res.body.event);
      assert.equal(res.body.event.text, text);
      done();
    });
    ddTransport.options.aggregation_key = transportAggregationKey;
    logger.log('info', text, { aggregation_key: '123' });
  });
    
  it('should disable the receiver', done => {
    logger.once('DatadogResult', res => {
            done(new Error('data receieved'));
        });
        ddTransport.stopResults();
        logger.on('logging', () => {
            setTimeout(done, 1000);
        });
        logger.log('info', 'foo');
    });
});
