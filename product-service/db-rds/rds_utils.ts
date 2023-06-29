import { Product, Stock } from "../types/types";
import Knex from "knex";
import knexConfig from "./knexfile";

const knex = Knex(knexConfig);

export const getAllProducts = async (): Promise<Product[]> => {
  const products = await knex("products")
    .select(
      "products.id",
      "products.description",
      "products.price",
      "products.title",
      "stocks.count"
    )
    .innerJoin("stocks", "products.id", "stocks.product_id");

  return products;
};

export const getByIdProduct = async (
  id: string
): Promise<Product | undefined> => {
  const product = await knex("products")
    .select(
      "products.id",
      "products.description",
      "products.price",
      "products.title",
      "stocks.count"
    )
    .innerJoin("stocks", "products.id", "stocks.product_id")
    .where("products.id", id)
    .first();

  return product;
};

export const createProductKnex = async (
  product: Product,
  stock: Stock
): Promise<void> => {
  try {
    await knex.transaction(async (trx) => {
      await trx("products").insert(product);
      await trx("stocks").insert(stock);
    });
  } catch (err) {
    console.error("Error creating product in transaction:", err);
    throw err;
  }
};
