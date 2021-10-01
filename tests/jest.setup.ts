import { shutdown, startUp } from './common';

const noop = () => void 0;

beforeAll(noop);

afterAll(noop);

beforeEach(async () => {
  await startUp();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
