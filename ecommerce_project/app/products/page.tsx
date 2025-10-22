'use client';
import React, { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/products?populate=*`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((item) => {
          const { id, name, description, price, image } = item;
          const imageUrl = image?.url
            ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${image.url}`
            : '/images/product1.webp'; // fallback to placeholder image
          return (
            <div key={id} className="border rounded-lg p-4 shadow-md flex flex-col items-center">
              <img src={imageUrl} alt={name} className="w-48 h-48 object-cover mb-4 rounded" />
              <h2 className="text-xl font-semibold mb-2">{name}</h2>
              <p className="mb-2 text-gray-700">{description}</p>
              <p className="font-bold text-indigo-600 mb-2">₹{price}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
