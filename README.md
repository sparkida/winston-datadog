[![Build Status](https://travis-ci.org/sparkida/winston-datadog.svg?branch=master)](https://travis-ci.org/sparkida/winston-datadog)
[![Coverage Status](https://coveralls.io/repos/github/sparkida/winston-datadog/badge.svg?branch=master)](https://coveralls.io/github/sparkida/winston-datadog?branch=master)

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

### Basic setup
```javascript
const winston = require('winston');
const DatadogTransport = require('winston-datadog');
const ddTransport = new DatadogTransport({
    api_key: '',
    app_key: '' //optional
});
const logger = new winston.Logger({
    transports: [
        ddTransport
    ]
});

```

### Receiving Results from Datadog
```javascript
ddTransport.receiveResults(logger);
logger.on('DatadogResult', (res) => {
    console.log(res);
});

// disable receiver
// ddTransport.stopResults();

// start receiver on last logger
// ddTransport.receiveResults();
```

### Event Options
```javascript
var ddTransport = new Datadog({ ... });
//have the text be used in place of title (default: false)
ddTransport.useTextAsTitle = true;
//or...set the new title to use
ddTransport.options.title = 'My Custom Title';
//set the new tags to use
ddTransport.options.tags = ['env:local', 'version:1', 'region:us-west-1'];

//do stuff ...

//reset options
ddTransport.resetOptions();
```


### Permanently Override Default Options
In case you have multiple instances of the transport running and/or find you need to permanently change the default `DatadogTransport.Options`
```javascript
var DatadogTransport = require('winston-datadog');
var Options = DatadogTransport.prototype.Options;
Options.prototype.title = 'Custom Global Title';
Options.prototype.tags = ['custom:MyCustomTag'];
//now these changes will persist through each instance
var ddTransport = new DatadogTransport({ ... });
console.log(ddTransport.options.title);
// 'Custom Global Title'
```


### Loglevels

When Winston passes logs off to the Datadog transport, winston-datadog will map the log type (info, warn, error, etc...) to the corresponding `ddTransport.options.alert_type`. A check will be done to see if the log type exists in `ddTransport.loglevels`, if found it will override the default log type sent from winston. We have to do this, for isntance, in order to map Winston->warn() to DatadogTransport->warning();

```javascript
var ddTransport = new Datadog({ ... });
console.log(ddTransport.loglevels);
// {
//     silly: 'info',
//     debug: 'info',
//     verbose: 'info',
//     warn: 'warning'
// }

// make all info messages route to ddTransport.options.alert_type = 'success'
ddTransport.loglevels.info = 'success';
// make all verbose messages route to ddTransport.options.alert_type = 'success'
ddTransport.loglevels.verbose = 'success';
```

Receiving Response Data
-----------------------
By default, this transport only sends logs, it does not do anything with the response object. Enabling the receiver will add some overhead, but may be necessary.


Events
------
***DatadogResult*** - emitted by the logger when a response object has finished receiving data. The response object will have a body object containing the resulting data.


Logging
-------
The body of the event(log) is limited to 4000 characters and supports markdown.


Options
-------
Each Datadog Transport instance will expose the following options via `ddTransport.options`

- **title** ***[default=LOG]*** - The event title. Limited to 100 characters.
- **date_happened** ***[optional, default=now]*** - POSIX timestamp of the event.
- **priority** ***[optional, default='normal']*** - The priority of the event ('normal' or 'low').
- **host** ***[optional, default=os.hostname()]*** - Host name to associate with the event.
- **tags** ***[optional, default='env:process.env.NODE_ENV']*** - A list of tags to apply to the event.
- **alert_type** ***[optional, default='info']*** - "error", "warning", "info" or "success". (These are overriden by the default winston log levels, but you can do something about that through `ddTransport.loglevels`
- **aggregation_key** ***[optional, default=None]*** - An arbitrary string to use for aggregation, max length of 100 characters.
- **source_type_name** ***[optional, default=None]*** - The type of event being posted. Options: nagios, hudson, jenkins, user, my apps, feed, chef, puppet, git, bitbucket, fabric, capistrano

Setting aggregation_key for a specific event
--------------------------------------------

Setting the aggregation key on the transport option should be sufficient for most situations, but there may be cases where you need to set the aggregation key for a specific log.
To do this you need to include the `aggregation_key` with the `data` passed to the `logger.log` function.

For example:
```javascript
// event with text
logger.log('info', 'event text', { aggregation_key: 'key' });

// event with object
var data = { foo: 'bar', bar: 'baz' };
data.aggregation_key = 'key';
logger.log('info', 'event text', data);

// event with error
var error = new Error();
error.aggregation_key = 'key';
logger.log('info', 'event text', error);
```

The `aggregation_key` is excluded from the `data` parameter that is passed to Datadog. This means that the `aggregation_key` will not be printed in the Datadog event logs.

Setting the `aggregation_key` via the `log` function will override the `aggregration_key` set via the transport options for that specific event log.

Thus the order in which the `aggregation_key` is applied is:

1. `data.aggregation_key`
1. `ddTransport.options.aggregation_key`
1. none if both of the aforementioned options are undefined

Updates
-------
* Added new feature [useTextAsTitle](https://github.com/sparkida/winston-datadog/pull/2) / updated for NodeJS 9 - @v1.1.0 08:30 PST Nov 27th, 2017
* Adds name to winston transports - @v1.0.2 09:03 PDT Feb 28th, 2016
* Stable Release - @v1.0.1 21:58 PDT Feb 27th, 2016
* Initial Release - 20:11 PDT Feb 27th, 2016
* Check back notice - 08:09 PDT Feb 27th, 2016
