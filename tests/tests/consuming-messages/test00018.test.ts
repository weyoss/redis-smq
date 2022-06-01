import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';

test('Producing duplicate messages', async () => {
  await createQueue(defaultQueue, false);
  const { producer, message } = await produceMessage();
  await expect(async () => {
    await producer.produceAsync(message);
  }).rejects.toThrow(
    'Can not publish a message with a metadata instance. Either you have already published the message or you have called the getSetMetadata() method.',
  );
});
