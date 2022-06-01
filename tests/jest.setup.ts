import { startUp } from './common/start-up';
import { shutdown } from './common/shut-down';
import { init } from './common/init';

beforeAll(init);

afterAll(() => void 0);

beforeEach(async () => {
  await startUp();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
