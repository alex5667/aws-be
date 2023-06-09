import { buildResponse } from "./buildResponse";
import { products } from "../db/products";

export const handler = async () => {
  try {
    return buildResponse(200, products);
  } catch (error) {
    return buildResponse(500, {
      message: error as string,
    });
  }
};
