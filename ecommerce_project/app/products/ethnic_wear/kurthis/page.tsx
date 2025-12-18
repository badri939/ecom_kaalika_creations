"use client";

import React, { useEffect, useState } from "react";

const PRODUCTS_PER_PAGE = 9;

export default function KurthisPage() {
	const [products, setProducts] = useState<any[]>([]);
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
		   fetch(
			   `${strapiUrl}/api/products?populate=*&filters[category][$eq]=Kurthis`
		   )
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

	const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
	const paginatedProducts = products.slice(
		(page - 1) * PRODUCTS_PER_PAGE,
		page * PRODUCTS_PER_PAGE
	);

	if (loading)
		return <div className="p-8 text-center">Loading...</div>;
	if (error)
		return (
			<div className="p-8 text-center text-red-500">{error}</div>
		);
	return (
		<div className="max-w-6xl mx-auto mt-10 px-4">
			<h1 className="text-3xl md:text-4xl font-extrabold text-pink-700 mb-4 text-center">
				Kurthis Collection
			</h1>
			<p className="text-lg md:text-xl text-gray-700 mb-8 text-center">
			</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
		       {paginatedProducts.map((item) => {
			   const { id, name, description, price, slug, image } = item;
		   const imageUrl = image?.url
			   ? (image.url.startsWith('http') ? image.url : `${process.env.NEXT_PUBLIC_STRAPI_URL}${image.url}`)
			   : "/images/product1.webp";
			   return (
				   <div
					   key={id}
					   className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
				   >
					   <a href={`/products/ethnic_wear/kurthis/${slug}`}>
						   <img
							   src={imageUrl}
							   alt={name}
							   className="w-full max-w-[160px] h-auto aspect-[3/4] object-contain rounded-md mb-3 mx-auto"
							   loading="lazy"
						   />
					   </a>
					   <h2 className="text-lg font-semibold text-pink-600">
						   {name}
					   </h2>
					   <p className="text-gray-600 text-sm mt-1 mb-2">
						   {description}
					   </p>
					   <span className="text-base font-bold text-gray-800">
						   ₹{price}
					   </span>
				   </div>
			   );
		       })}
			</div>
			<div className="flex justify-center items-center gap-4">
				<button
					className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page === 1}
				>
					Previous
				</button>
				<span className="text-gray-700 font-medium">
					Page {page} of {totalPages}
				</span>
				<button
					className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
					onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
					disabled={page === totalPages}
				>
					Next
				</button>
			</div>
		</div>
	);
}
