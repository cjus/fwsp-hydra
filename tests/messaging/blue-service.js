'use strict';

const hydra = require('../../index');

const config = {
  hydra: {
    serviceName: 'blue-service',
    serviceDescription: 'Blue test service',
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

let count = 0;

hydra.init(config)
  .then(() => {
    hydra.registerService()
      .then((serviceInfo) => {
        console.log(`Running ${serviceInfo.serviceName} at ${serviceInfo.serviceIP}:${serviceInfo.servicePort}`);
        hydra.on('message', (message) => {
          console.log(`Received object message: ${msg.mid}: ${JSON.stringify(msg)}`);
        });
        setInterval(() => {
          hydra.sendMessage(hydra.createUMFMessage({
            to: 'red-service:/',
            from: 'blue-service:/',
            body: {
              count
            }
          }));
          count += 1;
        }, 2000);
      });
  })
  .catch((err) => {
    console.log('Blue service terminating:', err);
    hydra.shutdown();
  });
