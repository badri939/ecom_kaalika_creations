"use client";
import { useCart } from "@/context/CardContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function KurthiDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { slug } = params as { slug: string };
	const { addToCart } = useCart();
	const [showToast, setShowToast] = useState(false);
	const [product, setProduct] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);

	useEffect(() => {
		if (!slug) return;
		   fetch(
			   `${process.env.EXT_PUBLIC_STRAPI_UR}/api/products?populate=*&filters[slug][$eq]=${encodeURIComponent(
				   slug
			   )}`
		   )
			.then((res) => res.json())
			.then((data) => {
				if (data.data && data.data.length > 0) {
					setProduct(data.data[0]);
				} else {
					setProduct(null);
				}
				setLoading(false);
			})
			.catch(() => {
				setError("Failed to fetch product");
				setLoading(false);
			});
	}, [slug]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}
	if (error || !product) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-indigo-100">
				<h1 className="text-2xl font-bold text-red-600 mb-4">
					Product Not Found
				</h1>
				<button
					onClick={() => router.back()}
					className="px-4 py-2 bg-gray-300 rounded"
				>
					Back
				</button>
			</div>
		);
	}

	   // Use Strapi attributes fields
	const attrs = product?.attributes || product;
	const name = attrs.name || attrs.Name;
	const description = attrs.description || attrs.Description;
	// Use productDetails array for detailed info
	const details = attrs.productDetails?.[0];
	const detailedDescription = details?.description;
	const detailedPrice = details?.price;
	const price = detailedPrice || attrs.price || attrs.Price;
	const imageObj = attrs.image || attrs.Image?.data?.attributes || {};
	   // Use main image or fallback
	   const imageUrl = imageObj.url
		   ? `${process.env.EXT_PUBLIC_STRAPI_UR}${imageObj.url}`
		   : "/images/product1.webp";
	const getPriceNumber = (price: any) =>
		typeof price === "number"
			? price
			: Number((price || "").replace(/[^\d]/g, ""));

	const handleAddToCart = () => {
		addToCart({
			id: product.id,
			name,
			price: getPriceNumber(price),
			image: imageUrl,
			quantity,
		});
		setShowToast(true);
		setTimeout(() => setShowToast(false), 2000);
	};

	   return (
		   <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-white to-indigo-100 px-4 py-10">
			   {showToast && (
				   <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all animate-fade-in">
					   Added to cart!
				   </div>
			   )}
			   <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center animate-fade-in">
				   <img
					   src={imageUrl}
					   alt={name}
					   className="w-full max-w-xs rounded-lg shadow-lg mb-6 border-4 border-pink-200"
				   />
				   <h1 className="text-3xl font-extrabold text-pink-700 mb-2 text-center">
					   {name}
				   </h1>
				  {detailedDescription && (
					  <p className="text-base text-gray-700 mb-4 text-center whitespace-pre-line">
						  {detailedDescription}
					  </p>
				  )}
				   <div className="text-2xl font-bold text-indigo-700 mb-6">
					   ₹{price}
				   </div>
				   <div className="flex items-center gap-4 mb-6">
					   <button
						   onClick={() => setQuantity((q) => Math.max(1, q - 1))}
						   className="px-3 py-1 bg-gray-200 rounded text-lg font-bold hover:bg-gray-300"
					   >
						   -
					   </button>
					   <span className="text-lg font-semibold">{quantity}</span>
					   <button
						   onClick={() => setQuantity((q) => q + 1)}
						   className="px-3 py-1 bg-gray-200 rounded text-lg font-bold hover:bg-gray-300"
					   >
						   +
					   </button>
				   </div>
				   <button
					   className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform duration-200 mb-4"
					   onClick={handleAddToCart}
				   >
					   Add to Cart
				   </button>
				   <button
					   onClick={() => router.back()}
					   className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
				   >
					   Back
				   </button>
			   </div>
		   </div>
	   );
}
