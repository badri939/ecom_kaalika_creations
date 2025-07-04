"use client";

import { useState } from "react";

// Dynamically list all images in the 'kuthis' subfolder
const kurthiImages = [
	"Kurti-set-2.gif",
	"Kurti-set-3.gif",
	"Kurti-Set10.gif",
	"Kurti-Set11.gif",
	"Kurti-Set12.gif",
	"Kurti-Set13.gif",
	"Kurti-Set15.gif",
	"Kurti-Set16.gif",
	"Kurti-Set17.gif",
	"KURTI-SET19.gif",
	"Kurti-Set20.gif",
	"Kurti-Set21.gif",
	"Kurti-Set5 (1).gif",
	"Kurti-Set5.gif",
	"Kurti-Set6.gif",
	"Kurti-Set7.gif",
	"Kurti-set9.gif",
	"kurti.pdf1.gif",
	"Kurti8.gif",
	"Kurtiset14.gif",
];

const products = kurthiImages.map((img, idx) => ({
	id: idx + 1,
	name: `Kurthi Set ${idx + 1}`,
	image: `/images/kuthis/${img}`,
	price: `₹${1299 + idx * 50}`,
	description: "Trendy kurthi set with unique design.",
}));

const PRODUCTS_PER_PAGE = 9;

export default function KurthisPage() {
	const [page, setPage] = useState(1);
	const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

	const paginatedProducts = products.slice(
		(page - 1) * PRODUCTS_PER_PAGE,
		page * PRODUCTS_PER_PAGE
	);

	return (
		<div className="max-w-6xl mx-auto mt-10 px-4">
			<h1 className="text-3xl md:text-4xl font-extrabold text-pink-700 mb-4 text-center">
				Kurthis Collection
			</h1>
			<p className="text-lg md:text-xl text-gray-700 mb-8 text-center">
				Discover our handpicked selection of stylish kurthis, perfect for every
				occasion. Shop the latest trends and timeless classics!
			</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
				{paginatedProducts.map((product) => (
					<div
						key={product.id}
						className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
					>
						<a href={`/products/ethnic_wear/kurthis/${product.image.split('/').pop()}`}>
							<img
								src={product.image}
								alt={product.name}
								className="w-full max-w-[160px] h-auto aspect-[3/4] object-contain rounded-md mb-3 mx-auto"
								loading="lazy"
							/>
						</a>
						<h2 className="text-lg font-semibold text-pink-600">
							{product.name}
						</h2>
						<p className="text-gray-600 text-sm mt-1 mb-2">
							{product.description}
						</p>
						<span className="text-base font-bold text-gray-800">
							{product.price}
						</span>
					</div>
				))}
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
