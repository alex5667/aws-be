import { handler as getProductsList } from "../handlers/getProductsList";
import { products } from "../db/products";

describe("getProductsList", () => {
  it("return a list of products", async () => {
    const data = await getProductsList();

    expect(data.statusCode).toBe(200);

    expect(JSON.parse(data.body).length).toBe(products.length);
  });
});