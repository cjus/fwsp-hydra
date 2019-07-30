'use strict';

const hydra = require('../../index');

const config = {
  hydra: {
    serviceName: 'red-service',
    serviceDescription: 'Red test service',
    serviceIP: '',
    servicePort: 0,
    serviceType: 'test',
    redis: {
      retry_strategy: {
        maxReconnectionAttempts: 10,
        maxDelayBetweenReconnections: 3
      },
      url: '127.0.0.1',
      port: 6379,
      db: 15
    }
  }
};

hydra.init(config)
  .then(() => {
    hydra.registerService()
      .then((serviceInfo) => {
        console.log(`Running ${serviceInfo.serviceName} at ${serviceInfo.serviceIP}:${serviceInfo.servicePort}`);
        hydra.on('message', (message) => {
          console.log(`Received object message: ${message.mid}: ${JSON.stringify(message)}`);
        });
      });
  })
  .catch((err) => {
    console.log('Red service terminating:', err);
    hydra.shutdown();
  });
