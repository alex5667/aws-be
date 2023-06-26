import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './utils';

export const importProductsFileHandler: Handler = async (event: APIGatewayProxyEvent) => {
  try {
    console.log('importProductsFile S3 event:', JSON.stringify(event, null, 2));

    const bucket = process.env.IMPORT_S3_BUCKET_NAME;
    const { name } = event.queryStringParameters || {};

    if (!bucket) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Bucket name is not configured' }),
      };
    }

    if(!name) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message:
          'Invalid request, query string parameter expected'
        }),
      }
    };

    const key = `uploaded/${name}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const expiresInMinutes = 2;
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInMinutes * 60,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message:
        signedUrl
      }),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
}