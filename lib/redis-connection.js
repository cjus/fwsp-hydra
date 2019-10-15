const Promise = require('bluebird');
let redis;
let selfRedisConnection;

/**
* @name RedisConnection
* @summary Handles Redis connect
*/
class RedisConnection {
  /**
  * @name constructor
  * @summary
  * @description
  * @param {object} redisConfig - redis configuration object
  * @param {number} defaultRedisDb - default redis database number
  * @param {boolean} testMode - whether redis mock library is being used
  * @return {undefined}
  */
  constructor(redisConfig, defaultRedisDb = 0, testMode = false) {
    if (testMode) {
      redis = require('redis-mock');
    } else {
      redis = require('redis');
      Promise.promisifyAll(redis.RedisClient.prototype);
      Promise.promisifyAll(redis.Multi.prototype);
    }

    let url = {};
    if (redisConfig.url) {
      let parsedUrl = require('redis-url').parse(redisConfig.url);
      url = {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
        db: parsedUrl.database
      };
      if (parsedUrl.password) {
        url.password = parsedUrl.password;
      }
    }
    this.redisConfig = Object.assign({db: defaultRedisDb}, url, redisConfig);
    if (this.redisConfig.host) {
      delete this.redisConfig.url;
    }
    this.options = {
      maxReconnectionAttempts: 5,
      maxDelayBetweenReconnections: 2
    };
    this.reconnectionAttempts = 0;
  }

  /**
  * @name getRedis
  * @summary Get Redis constructor
  * @return {funcion} redis
  */
  getRedis() {
    return redis;
  }

  /**
   * @name connect
   * @summary connection entry point
   * @param {object} options - connection options - description
   * @return {undefined}
   */
  connect(options) {
    if (options) {
      this.options = {...this.options, ...options};
    }

    selfRedisConnection = this;
    this.redisConfig.retry_strategy = this._redisRetryStrategy;

    return this._connect();
  }

/**
 * @name _connect
 * @summary private member used by connect to rettry connections
 * @return {object} promise
 */
_connect() {
  let self = new Promise((resolve, reject) => {
    let db = redis.createClient(this.redisConfig);
    db
    .once('ready', () => {
      console.log('[redis-connection]: connection ready', this.reconnectionAttempts);
      this.reconnectionAttempts = 0;
      resolve(db);
    })
    .on('connect', () => {
      console.log('[redis-connection]: connected', this.reconnectionAttempts);
      this.reconnectionAttempts = 0;
    })
    .on('error', (err) => {
      console.log('[redis-connection]: Redis error', err);
      if (self.isPending()) {
        db.end(false);
        return reject(err);
      }
    })
    .on('reconnecting', (err) => {
      console.log(`[redis-connection]: reconnecting... attempt ${this.reconnectionAttempts + 1}/${this.options.maxReconnectionAttempts}`);

      if (++this.reconnectionAttempts >= this.options.maxReconnectionAttempts) {
        if (self.isPending()) {
          db.end(false);
          return reject(err);
        }
      }
    });
  });
    return self;
  }

  /**
  * @name _redisRetryStrategy
  * @summary NodeJS redis retry_strategy function
  * @return milliseconds (or, read NodeJS redis module documentation)
  */
  _redisRetryStrategy() {
    return selfRedisConnection.options.maxDelayBetweenReconnections * 1000;
  }
}

module.exports = RedisConnection;
