import { Handler } from 'aws-lambda';
import { getAllProducts } from '../db-rds/rds_utils';
import { buildResponse } from "../services/buildResponse";

export const getProductsList: Handler = async (event) => {
  console.log("Event getProductsList", event);

  try {
    const products = await getAllProducts();
    return buildResponse(200, products);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return buildResponse(500, err.message);
    } else {
      return buildResponse(500, "Unknown error occurred");
    }
  }
};
