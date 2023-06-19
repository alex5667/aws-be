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

const dynamoDb = DynamoDBDocument.from(new DynamoDBClient({}));
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
  console.log(event);

  const requestBody =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const product: Product = requestBody;
  const id = uuidv4();
  product.id = id;

  const stock = {
    product_id: id,
    count: Math.floor(Math.random() * 100),
  };

  const { error: validationError } = schema.validate(product);

  if (!validationError) {
    try {
      await dynamoDb.send(
        new PutCommand({
          TableName: TableName,
          Item: product,
        })
      );
      await dynamoDb.send(
        new PutCommand({
          TableName: StockTable,
          Item: stock,
        })
      );

      const updatedProduct = { ...product, count: stock.count };
      const successMessage = "Product created successfully";
      console.log(successMessage, updatedProduct);
      return buildResponse(200, [successMessage, updatedProduct]);
    } catch (err) {
      const errorMessage = "Failed to insert data into databases";
      console.error(errorMessage, err);
      return buildResponse(500, errorMessage);
    }
  } else {
    const validationErrorMessage = `Invalid data: ${validationError.details
      .map((detail) => detail.message)
      .join(", ")}`;
    return buildResponse(400, validationErrorMessage);
  }
};
