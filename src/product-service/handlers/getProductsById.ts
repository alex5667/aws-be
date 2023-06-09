import { buildResponse } from "./buildResponse";
import { products } from "../db/products";
import { APIGatewayProxyEventPathParameters } from "aws-lambda";

const getProduct = (pathParameters: APIGatewayProxyEventPathParameters) => {
  const productId = Number(pathParameters.productId);
  return products.find((product) => product.id === productId);
};

export const handler = async (event: {
  pathParameters: { productId?: string };
}) => {
  try {
    const pathParameters = event.pathParameters || {};
    const product = getProduct(pathParameters);

    if (product) {
      return buildResponse(200, product);
    } else {
      throw new Error("Product not found");
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const code = errorMessage === "Product not found" ? 404 : 500;
    return buildResponse(code, {
      message: errorMessage,
    });
  }
};