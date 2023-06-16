import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { buildResponse } from "./buildResponse";

const dynamo = DynamoDBDocument.from(new DynamoDB({}));

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event);

  try {
    const productsScan = await dynamo.scan({
      TableName: process.env.TABLENAME!,
    });

    const stocksScan = await dynamo.scan({
      TableName: process.env.STOCKTABLENAME!,
    });

    const products = productsScan.Items ?? [];
    const stocks = stocksScan.Items ?? [];

    products.forEach((product) => {
      stocks.forEach((stock) => {
        if (product.id === stock.product_id) {
          Object.assign(product, { count: stock.count });
        }
      });
    });

    if (products.length === 0) {
      return buildResponse(500, "There are no data in DB");
    } else if (stocks.length === 0) {
      return buildResponse(500, "There was an error fetching data from DB");
    }

    return buildResponse(200, products);
  } catch (error) {
    console.error(error);
    return buildResponse(500, "An error occurred while fetching data from DB");
  }
};