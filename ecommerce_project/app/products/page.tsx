"use client"
import Image from "next/image";
import Link from "next/link";

const sampleProducts = [
  {
    id: 1,
    name: "Classic White Shirt",
    image: "/images/classic-white-shirt.webp",
    price: "$25.00",
  },
  {
    id: 2,
    name: "Modern Casual Sneakers",
    image: "/images/modern-casual-sneakers.webp",
    price: "$50.00",
  },
  {
    id: 3,
    name: "Stylish Blue Denim Jacket",
    image: "/images/stylish-blue-denim-jacket.webp",
    price: "$40.00",
  },
  {
    id: 4,
    name: "Product 1",
    image: "/images/product1.webp",
    price: "$30.00",
  },
  {
    id: 5,
    name: "Product 2",
    image: "/images/product2.webp",
    price: "$35.00",
  },
  {
    id: 6,
    name: "Product 3",
    image: "/images/product3.webp",
    price: "$20.00",
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sampleProducts.map((product) => (
          <div key={product.id} className="border rounded-lg shadow-md p-4">
            <Image
              src={product.image}
              alt={product.name}
              width={300}
              height={300}
              className="w-full h-48 object-contain mb-4"
            />
            <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
            <p className="text-gray-600">{product.price}</p>
            <Link href={`/products/${product.id}`} passHref>
              <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
