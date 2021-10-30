import { MonitorServer } from '../..'; // from 'redis-smq';
import { config } from './config';

MonitorServer(config)
  .listen()
  .then(() => {
    console.log('It works!');
  });
