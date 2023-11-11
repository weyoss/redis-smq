import { startUp } from './common/start-up';
import { shutdown } from './common/shut-down';

beforeAll(() => void 0);

afterAll(() => void 0);

beforeEach(async () => {
  await startUp();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
