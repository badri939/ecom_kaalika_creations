"use client";

import React, { useEffect, useState } from "react";

const PRODUCTS_PER_PAGE = 9;

type Product = {
  id: number | string;
  name: string;
  description: string;
  price: number | string;
  imageUrl: string;
  category: string;
};

const fallbackImage = "/images/product1.webp";

function normalizeProduct(item: any, strapiUrl: string): Product | null {
  if (!item) return null;

  const source = item.attributes ?? item;
  const id = item.id ?? source.id;
  if (id === undefined || id === null) return null;

  const name = source.name ?? source.Name ?? "Untitled Product";
  const description = source.description ?? source.Description ?? "";
  const price = source.price ?? source.Price ?? "N/A";
  const category =
    source.category ??
    source.Category ??
    source.categoryName ??
    source.category_name ??
    source.categories?.data?.[0]?.attributes?.name ??
    "";

  const imageSource =
    source.image?.data?.attributes ??
    source.Image?.data?.attributes ??
    source.image ??
    source.Image ??
    null;

  const rawUrl =
    typeof imageSource?.url === "string"
      ? imageSource.url
      : typeof imageSource === "string"
      ? imageSource
      : "";

  const imageUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${strapiUrl}${rawUrl}`
    : fallbackImage;

  return { id, name, description, price, imageUrl, category: String(category) };
}

export default function LehengasPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    if (!strapiUrl) {
      setError("Strapi API URL is not set");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      const endpoint = `${strapiUrl}/api/products?populate=*`;

      const tryQueries = [
        `${endpoint}&filters[category][$eqi]=Lehengas`,
        `${endpoint}&filters[category][$containsi]=lehenga`,
        `${endpoint}&filters[categories][name][$containsi]=lehenga`,
      ];

      let rawProducts: any[] = [];

      for (const query of tryQueries) {
        const response = await fetch(query);
        if (!response.ok) continue;
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        if (rows.length > 0) {
          rawProducts = rows;
          break;
        }
      }

      if (rawProducts.length === 0) {
        const allProductsResponse = await fetch(endpoint);
        if (!allProductsResponse.ok) {
          throw new Error(`Request failed with status ${allProductsResponse.status}`);
        }
        const allProductsData = await allProductsResponse.json();
        const allRows = Array.isArray(allProductsData?.data) ? allProductsData.data : [];
        rawProducts = allRows.filter((item: any) => {
          const source = item?.attributes ?? item ?? {};
          const text = [
            source?.category,
            source?.Category,
            source?.categoryName,
            source?.category_name,
            source?.categories?.data?.[0]?.attributes?.name,
            source?.name,
            source?.Name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes("lehenga");
        });
      }

      const normalizedProducts = rawProducts
        .map((item: any) => normalizeProduct(item, strapiUrl))
        .filter(Boolean) as Product[];

      setProducts(normalizedProducts);
      setLoading(false);
    };

    fetchProducts().catch(() => {
      setError("Failed to fetch products");
      setLoading(false);
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = products.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h1 className="text-3xl md:text-4xl font-extrabold text-pink-700 mb-4 text-center">
        Lehengas Collection
      </h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-600 mb-8">No lehengas found right now.</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
        {paginatedProducts.map((item) => {
          const { id, name, description, price, imageUrl } = item;

          return (
            <div
              key={id}
              className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
            >
              <img
                src={imageUrl}
                alt={name}
                className="w-full max-w-[160px] h-auto aspect-[3/4] object-contain rounded-md mb-3 mx-auto"
                loading="lazy"
              />
              <h2 className="text-lg font-semibold text-pink-600">{name}</h2>
              <p className="text-gray-600 text-sm mt-1 mb-2">{description}</p>
              <span className="text-base font-bold text-gray-800">₹{price}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center items-center gap-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-gray-700 font-medium">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          disabled={page === totalPages || products.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}
