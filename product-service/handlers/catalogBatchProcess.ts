import { Handler } from "aws-lambda";
import { createProduct } from "./createProduct";
import { Context } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const sns = new SNSClient({});

export const catalogBatchProcessHandler: Handler = async (event) => {
  console.log("catalogBatchProcess", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const newProductResponse = await createProduct(
        record,
        {} as Context,
        () => {}
      );

      console.log("newProductData", newProductResponse);
      const parsedMessage = JSON.parse(newProductResponse.body).message;

      const snsParams = {
        Subject: "Product Created",
        Message: `A new product has been created: ${JSON.stringify(
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
        console.log("SNS event sent:", snsParams);
      } else {
        console.log("SNS event not sent:", snsParams);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: event.Records }),
    };
  } catch (err: any) {
    console.error("Error by processing file:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error creating product: ${err.message}`,
      }),
    };
  }
};
