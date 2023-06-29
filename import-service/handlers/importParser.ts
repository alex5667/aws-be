import { Handler, S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { CsvRecord } from "../types/types";

import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const processCsvRecords = (
  stream: Readable,
  onRecordHandler: (record: CsvRecord) => Promise<void>
) => {
  return new Promise<void>((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", async (row: CsvRecord) => {
        stream.pause();
        try {
          await onRecordHandler(row);
        } catch (error) {
          reject(error);
        }
        stream.resume();
      })
      .on("end", resolve)
      .on("error", reject);
  });
};

export const importParser: Handler<S3Event> = async (
  event: S3Event
) => {
  try {
    console.log("Processing S3 event:", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
      const bucketName: string = record.s3.bucket.name;
      const objectKey: string = record.s3.object.key;

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const response = await s3Client.send(getObjectCommand);

      if (!(response.Body instanceof Readable)) {
        throw new Error("Unable to read the file.");
      }

      const readableStream = response.Body;
      await processCsvRecords(readableStream, async (row: CsvRecord) => {
        console.log("Processing CSV record:", row);

        const sendMessageCommand = new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL!,
          MessageBody: JSON.stringify(row),
        });

        try {
          await sqsClient.send(sendMessageCommand);
          console.log("Message sent to SQS:", row);
        } catch (error) {
          console.error("Error sending message to SQS:", error);
        }
      });

      const newObjectKey: string = objectKey.replace("uploaded/", "parsed/");
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${objectKey}`,
        Key: newObjectKey,
      });
      await s3Client.send(copyCommand);
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey })
      );

      console.log(`File '${objectKey}' has been successfully moved to '${newObjectKey}'.`);
    }
  } catch (error) {
    console.error("An error occurred while processing the S3 object:", error);
  }
};