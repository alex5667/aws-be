import { handler as getProductsById } from "../handlers/getProductsById";

describe("getProductsById", () => {
  it("should return product details when product exists", async () => {
    const data = await getProductsById({
      pathParameters: {
        productId: "1",
      },
    });
    expect(data.statusCode).toBe(200);
    expect(JSON.parse(data.body)).toEqual({
      id: 1,
      title: "iPhone 9",
      description: "An apple mobile which is nothing like apple",
      price: 549,
      discountPercentage: 12.96,
      rating: 4.69,
      stock: 94,
      brand: "Apple",
      category: "smartphones",
      thumbnail: "https://i.dummyjson.com/data/products/1/thumbnail.jpg",
      images: [
        "https://i.dummyjson.com/data/products/1/1.jpg",
        "https://i.dummyjson.com/data/products/1/2.jpg",
        "https://i.dummyjson.com/data/products/1/3.jpg",
        "https://i.dummyjson.com/data/products/1/4.jpg",
        "https://i.dummyjson.com/data/products/1/thumbnail.jpg",
      ],
    });
  });

  it("return 404 when product does not exist", async () => {
    const data = await getProductsById({
      pathParameters: {
        productId: "30",
      },
    });
    expect(data.statusCode).toBe(404);
    expect(JSON.parse(data.body)).toEqual({
      message: "Product not found",
    });
  });
});