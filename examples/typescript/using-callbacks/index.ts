import { init } from './setup';
import { produce } from './producer';
import { consume } from './consumer';

// To simplify the example, we are ignoring errors from callbacks
init(() => produce(() => consume(() => void 0)));
