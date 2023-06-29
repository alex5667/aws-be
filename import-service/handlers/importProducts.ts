import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { buildResponse } from "../services/buildResponse";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const importProducts: Handler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    console.log("importProducts S3 event:", JSON.stringify(event, null, 2));

    const bucket = process.env.IMPORT_S3_BUCKET_NAME;
    const { name } = event.queryStringParameters || {};

    if (!bucket) {
      return buildResponse(500,"Bucket name is not configured");
    }

    if (!name) {
      return buildResponse(400,"Invalid request, query string parameter expected");
    }

    const key = `uploaded/${name}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const expiresInMinutes = 2;
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInMinutes * 60,
    });

    return buildResponse(200,signedUrl);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return buildResponse(500, err.message);
    } else {
      return buildResponse(500, "Unknown error occurred");
    }
};
