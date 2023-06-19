import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { products } from "../db/products";
import { buildResponse } from "./buildResponse";

const dynamo = DynamoDBDocument.from(new DynamoDB({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TableName = process.env.TABLENAME!;
const StockTable = process.env.STOCKTABLENAME!;

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  packSize?: string;
}

export const handler = async () => {
  const notAdded: string[] = [];
  const added: Product[] = [];

  for (let i = 0; i < products.length; i++) {
    const productsScan = await dynamo.scan({
      TableName: TableName,
    });

    const productsInDb = productsScan.Items as Product[];

    const id = uuidv4();
    products[i].id = id;

    const item: Product = {
      id: products[i].id,
      title: products[i].title,
      description: products[i].description,
      price: products[i].price,
      image: products[i].thumbnail,
    };

    console.log(item);

    const stock = {
      product_id: id,
      count: Math.floor(Math.random() * 100),
    };

    if (productsInDb.some((product) => product.title === item.title)) {
      console.log("This product is already in DB");
      notAdded.push(item.title);
    } else {
      try {
        await dynamo.send(
          new PutCommand({
            TableName: TableName,
            Item: item,
          })
        );

        await dynamo.send(
          new PutCommand({
            TableName: StockTable,
            Item: stock,
          })
        );

        added.push(item);
      } catch (err) {
        console.log(err);
        return buildResponse(
          400,
          `Failed to insert data to databases ${TableName} and ${StockTable}`
        );
      }
    }

    if (i === products.length - 1) {
      return buildResponse(
        200,
        `${notAdded.length} products were already in DB, ${added.length} products successfully added to DB`
      );
    }
  }
};
