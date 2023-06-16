import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { buildResponse } from "./buildResponse";

const dynamo = DynamoDBDocument.from(new DynamoDB({}));

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event);
  const id = event?.pathParameters?.productId;

  if (!id || !event.pathParameters) {
    return buildResponse(400, "Missing product ID");
  }

  try {
    const productResult = await dynamo.get({
      TableName: process.env.TABLENAME!,
      Key: {
        id,
      },
    });

    const stockResult = await dynamo.get({
      TableName: process.env.STOCKTABLENAME!,
      Key: {
        product_id: id,
      },
    });

    const stock = stockResult.Item;
    const product = productResult.Item;

    if (!product) {
      return buildResponse(400, "Product not found");
    }

    const response = {
      ...product,
      count: stock?.count,
    };

    return buildResponse(200, response);
  } catch (error) {
    console.error(error);
    return buildResponse(500, "An error occurred while retrieving the product");
  }
};
