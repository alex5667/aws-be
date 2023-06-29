export interface ProductCreated {
  description: string;
  price: number;
  title: string;
  count: number;
}

export interface Product {
  id: string;
  description: string;
  price: number;
  title: string;
}

export interface Stock {
  product_id: string;
  count: number;
}
