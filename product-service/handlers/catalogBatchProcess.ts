import { Handler } from "aws-lambda";
import { createProduct } from "./createProduct";
import { Context } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { buildResponse } from "../services/buildResponse";
const sns = new SNSClient({});

export const catalogBatchProcess: Handler = async (event) => {
  console.log("catalogBatchProcess", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const newProductResponse = await createProduct(
        record,
        {} as Context,
        () => {}
      );

      console.log("newProductResponse", newProductResponse);
      const parsedMessage = JSON.parse(newProductResponse.body).message;

      const snsParams = {
        Subject: "Product Created",
        Message: `New product created: ${JSON.stringify(
          parsedMessage
        )}`,
        TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
        MessageAttributes: {
          count: {
            DataType: "Number",
            StringValue: parsedMessage.count,
          },
        },
      };
      if (newProductResponse.statusCode === 200) {
        await sns.send(new PublishCommand(snsParams));
        console.log("Successfully published SNS message:", snsParams);
      } else {
        console.log("Failed to publish SNS message:", snsParams);
      }
    }

    return buildResponse(200, event.Records);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return buildResponse(500, `Error : ${err.message}`);
    } else {
      return buildResponse(500, `Unknown error occurred`);
    }
  }
};
