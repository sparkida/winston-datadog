[![Build Status](https://travis-ci.org/sparkida/winston-datadog.svg?branch=master)](https://travis-ci.org/sparkida/winston-datadog)

Winston-Datadog
---------------
Super light transport for logging Datadog events


Install
-------
```
npm install --save winston-datadog
```


Examples
--------

###Basic setup
```javascript
const ddTransport = require('winston-datadog');
const winston = require('winston');
const logger = new winston.Logger({
    transports: [
        ddTransport 
    ]
});

```

###Receiving Results from Datadog
```javascript
ddTransport.receiveResults(logger);
logger.on('DatadogResult', (res) => {
    console.log(res);
});

// disable receiver
// ddTransport.stopResults();

```


Receiving Response Data
-----------------------

By default, this transport only sends logs, it does not do anything with the response object. Enabling the receiver will add some overhead, but may be necessary.



Events
------
***DatadogResult*** - emitted by the logger when a response object has finished receiving data. The response object will have a body object containing the resulting data.


Updates
-------
* Initial Release - 20:11 PDT Feb 27th, 2016
* Check back notice - 08:09 PDT Feb 27th, 2016
