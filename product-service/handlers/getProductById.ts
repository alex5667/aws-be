import { Handler } from 'aws-lambda';
import { getByIdProduct } from '../db-rds/rds_utils';
import { buildResponse } from '../services/buildResponse';

export const getProductById: Handler = async (event)=> {
  console.log("Event getProductById", event);
  const { productId } = event.pathParameters;

  if (!productId) {
    return buildResponse(400, "Missing product ID");
  }

  try {
    const product = await getByIdProduct(productId);

    if (!product) {
      return buildResponse(404, "Product not found");
    }

    return buildResponse(200, product);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return buildResponse(500, err.message);
    } else {
      return buildResponse(500, "Unknown error occurred");
    }
  }
};

