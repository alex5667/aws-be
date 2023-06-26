import { Handler, S3Event} from 'aws-lambda';
import { GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, sqsClient } from './utils';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { ICsvRecord } from './types';

function processCsvRecords(stream: Readable, onRecordHandler: (record: ICsvRecord) => Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', async (row: ICsvRecord) => {
        stream.pause();
        try {
          await onRecordHandler(row);
        } catch (error) {
          reject(error);
        }
        stream.resume();
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

export const importFileParserHandler: Handler = async (event: S3Event) => {
  try {
    console.log('importFileParser S3 event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;

      const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
      const response = await s3.send(getObjectCommand);

      if (!(response.Body instanceof Readable)) {
        throw new Error('Failed to read the file');
      }

      const readableStream = response.Body;
      await processCsvRecords(readableStream, async (row: ICsvRecord) => {
        console.log('CSV record:', row);

        const sendMessageCommand = new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
          MessageBody: JSON.stringify(row),
        });

        try {
          await sqsClient.send(sendMessageCommand);
          console.log('Message sent to SQS:', row);
        } catch (error) {
          console.error('Error sending message to SQS:', error);
        }
      })

        const newObjectKey = objectKey.replace('uploaded/', 'parsed/');
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${objectKey}`,
          Key: newObjectKey,
        });
        await s3.send(copyCommand);
        await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey }));

        console.log(`Moved the file from '${objectKey}' to '${newObjectKey}'`);
    }
  } catch (err: any) {
    console.error('Error by processing S3 object:', err);
  }
}
