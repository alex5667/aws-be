import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "./buildResponse";
import Joi from "joi";
interface Product {
  title: string;
  description?: string;
  price: number;
  image?: string;
  id: string;
}
const dynamo = DynamoDBDocument.from(new DynamoDBClient({}));
const TableName = process.env.TABLENAME!;
const StockTable = process.env.STOCKTABLENAME!;

const schema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string(),
  price: Joi.number().positive().required(),
  image: Joi.string(),
  id: Joi.string().guid(),
});

export const handler = async (event: APIGatewayProxyEvent) => {
  const body =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const product: Product = body;
  const id = uuidv4();
  product.id = id;

  const stock = {
    product_id: id,
    count: Math.floor(Math.random() * 100),
  };

  const { error: validationError } = schema.validate(product);

  if (!validationError) {
    try {
      await dynamo.send(
        new PutCommand({
          TableName: TableName,
          Item: product,
        })
      );
      await dynamo.send(
        new PutCommand({
          TableName: StockTable,
          Item: stock,
        })
      );

      const finalProduct = { ...product, count: stock.count };
      const successMessage = ["Product was created successfully", finalProduct];
      console.log(successMessage);
      return buildResponse(200, successMessage);
    } catch (err) {
      return buildResponse(500, err);
    }
  } else {
    const failMessage = `Invalid data: ${validationError.details
      .map((detail) => detail.message)
      .join(", ")}`;
    return buildResponse(400, failMessage);
  }
};
