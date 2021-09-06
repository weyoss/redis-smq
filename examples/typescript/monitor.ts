import { MonitorServer } from '../..'; // from 'redis-smq';
import { config } from './config';

MonitorServer(config).listen(() => {
  console.log('It works!');
});
