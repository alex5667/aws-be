import { Handler } from "aws-lambda";
import { buildResponse } from "../services/buildResponse";
import { createProductKnex } from "../db-rds/rds_utils";
import { Product, ProductCreated, Stock } from "../types/types";
import { v4 as uuidv4 } from "uuid";

export const createProduct: Handler = async (event) => {
  console.log("Event createProduct", event);

  try {
    if (event.body) {
      const body: ProductCreated = JSON.parse(event.body);
      const { title, description, price, count } = body;
      if (
        [
          !title,
          !description,
          Number(price) < 0,
          isNaN(Number(price)),
          Number(count) < 0,
          isNaN(Number(count)),
        ].some((condition) => condition)
      ) {
        return buildResponse(400, "Invalid input data");
      }

      const id = uuidv4();
      const product: Product = { description, id, title, price };
      const stock: Stock = { product_id: id, count };

      await createProductKnex(product, stock);

      return buildResponse(
        200,
        `Product created successfully ${id}, ${description}, ${title}, ${price}, ${count}`
      );
    }

    return buildResponse(400, "Invalid data");
  } catch (err: unknown) {
    if (err instanceof Error) {
      return buildResponse(500, `Error creating product: ${err.message}`);
    } else {
      return buildResponse(500, `Unknown error occurred`);
    }
  }
};
