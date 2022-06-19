import { init } from './setup';
import { produce } from './producer';
import { consume } from './consumer';

// For simplicity, we are using nested callbacks
init((err) => {
  if (err) throw err;
  produce((err) => {
    if (err) throw err;
    consume((err) => {
      if (err) throw err;
    });
  });
});
