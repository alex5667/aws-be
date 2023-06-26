import Knex from "knex";
import { config as dotenvConfig } from "dotenv";
import { Product, Stock } from "../types/types";

dotenvConfig({ path: "../.env" });

export const config = {
  client: "pg",
  connection: {
    host: process.env.RDS_HOST,
    port: Number(process.env.RDS_PORT),
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
  },
  migrations: {
    directory: "./services",
    tableName: "createTable",
    extension: "ts",
  },
  seeds: {
    directory: "./services",
    tableName: "fill-tables",
    extension: "ts",
  },
};

export const knex = Knex(config);

export const getAllProducts = async () => {
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

export const getByIdProduct = async (id: string) => {
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

export const addProduct = async (product: Product, stock: Stock) => {
  try {
    await knex.transaction(async (trx) => {
      await trx("products").insert(product);
      await trx("stocks").insert(stock);
    });
  } catch (err) {
    console.error("Failed to create product :", err);
    throw err;
  }
};
