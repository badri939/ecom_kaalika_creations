"use client";
import { useCart } from "@/context/CardContext";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const productData = [
	{
		slug: "Kurti-set-2.gif",
		name: "Kurthi Set 1",
		image: "/images/kuthis/Kurti-set-2.gif",
		price: "₹1299",
		description:
			"A vibrant and stylish kurthi set, perfect for festive occasions and daily wear. Crafted with premium fabric for all-day comfort.",
	},
	{
		slug: "Kurti-set-3.gif",
		name: "Kurthi Set 2",
		image: "/images/kuthis/Kurti-set-3.gif",
		price: "₹1349",
		description:
			"Elegant kurthi set with intricate patterns and a modern silhouette. Ideal for both casual and semi-formal events.",
	},
	{
		slug: "Kurti-Set10.gif",
		name: "Kurthi Set 3",
		image: "/images/kuthis/Kurti-Set10.gif",
		price: "₹1399",
		description:
			"Chic and comfortable, this kurthi set features a unique design that stands out in any crowd.",
	},
	{
		slug: "Kurti-Set11.gif",
		name: "Kurthi Set 4",
		image: "/images/kuthis/Kurti-Set11.gif",
		price: "₹1449",
		description:
			"A beautiful blend of tradition and trend, this kurthi set is a must-have for your ethnic wardrobe.",
	},
	{
		slug: "Kurti-Set12.gif",
		name: "Kurthi Set 5",
		image: "/images/kuthis/Kurti-Set12.gif",
		price: "₹1499",
		description:
			"Soft hues and delicate embroidery make this kurthi set a timeless classic.",
	},
	{
		slug: "Kurti-Set13.gif",
		name: "Kurthi Set 6",
		image: "/images/kuthis/Kurti-Set13.gif",
		price: "₹1549",
		description:
			"Step out in style with this designer kurthi set, perfect for festive gatherings.",
	},
	{
		slug: "Kurti-Set15.gif",
		name: "Kurthi Set 7",
		image: "/images/kuthis/Kurti-Set15.gif",
		price: "₹1599",
		description:
			"A modern take on ethnic wear, this kurthi set is both comfortable and fashionable.",
	},
	{
		slug: "Kurti-Set16.gif",
		name: "Kurthi Set 8",
		image: "/images/kuthis/Kurti-Set16.gif",
		price: "₹1649",
		description:
			"Bright colors and a flattering fit make this kurthi set a favorite for all occasions.",
	},
	{
		slug: "Kurti-Set17.gif",
		name: "Kurthi Set 9",
		image: "/images/kuthis/Kurti-Set17.gif",
		price: "₹1699",
		description:
			"Make a statement with this bold and beautiful kurthi set, designed for the modern woman.",
	},
	{
		slug: "KURTI-SET19.gif",
		name: "Kurthi Set 10",
		image: "/images/kuthis/KURTI-SET19.gif",
		price: "₹1749",
		description:
			"A fusion of comfort and style, this kurthi set is perfect for any event.",
	},
	{
		slug: "Kurti-Set20.gif",
		name: "Kurthi Set 11",
		image: "/images/kuthis/Kurti-Set20.gif",
		price: "₹1799",
		description:
			"Classic patterns and a contemporary cut make this kurthi set a wardrobe essential.",
	},
	{
		slug: "Kurti-Set21.gif",
		name: "Kurthi Set 12",
		image: "/images/kuthis/Kurti-Set21.gif",
		price: "₹1849",
		description:
			"Turn heads with this elegant kurthi set, crafted for those who love to stand out.",
	},
	{
		slug: "Kurti-Set5 (1).gif",
		name: "Kurthi Set 13",
		image: "/images/kuthis/Kurti-Set5 (1).gif",
		price: "₹1899",
		description:
			"A playful and pretty kurthi set, perfect for day-to-night transitions.",
	},
	{
		slug: "Kurti-Set5.gif",
		name: "Kurthi Set 14",
		image: "/images/kuthis/Kurti-Set5.gif",
		price: "₹1949",
		description:
			"A blend of tradition and modernity, this kurthi set is a versatile addition to your closet.",
	},
	{
		slug: "Kurti-Set6.gif",
		name: "Kurthi Set 15",
		image: "/images/kuthis/Kurti-Set6.gif",
		price: "₹1999",
		description:
			"Soft fabric and a relaxed fit make this kurthi set a go-to for comfort and style.",
	},
	{
		slug: "Kurti-Set7.gif",
		name: "Kurthi Set 16",
		image: "/images/kuthis/Kurti-Set7.gif",
		price: "₹2049",
		description:
			"A vibrant kurthi set with eye-catching details, perfect for festive occasions.",
	},
	{
		slug: "Kurti-set9.gif",
		name: "Kurthi Set 17",
		image: "/images/kuthis/Kurti-set9.gif",
		price: "₹2099",
		description:
			"A modern kurthi set with a classic touch, ideal for all-day wear.",
	},
	{
		slug: "kurti.pdf1.gif",
		name: "Kurthi Set 18",
		image: "/images/kuthis/kurti.pdf1.gif",
		price: "₹2149",
		description:
			"Unique design and premium quality fabric make this kurthi set a must-have.",
	},
	{
		slug: "Kurti8.gif",
		name: "Kurthi Set 19",
		image: "/images/kuthis/Kurti8.gif",
		price: "₹2199",
		description:
			"A stylish kurthi set with a contemporary vibe, perfect for the fashion-forward.",
	},
	{
		slug: "Kurtiset14.gif",
		name: "Kurthi Set 20",
		image: "/images/kuthis/Kurtiset14.gif",
		price: "₹2249",
		description:
			"A beautiful kurthi set with intricate details and a flattering fit.",
	},
];

export default function KurthiDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { slug } = params as { slug: string };
	const { addToCart } = useCart();
	const [showToast, setShowToast] = useState(false);
	const product = productData.find((p) => p.slug === slug);

	if (!product) {
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

	// Helper to convert price string to number
	const getPriceNumber = (price: string) =>
		Number(price.replace(/[^\d]/g, ""));

	const handleAddToCart = () => {
		addToCart({
			id: productData.indexOf(product) + 1,
			name: product.name,
			price: getPriceNumber(product.price),
			image: product.image,
			quantity: 1,
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
					src={product.image}
					alt={product.name}
					className="w-full max-w-xs rounded-lg shadow-lg mb-6 border-4 border-pink-200"
				/>
				<h1 className="text-3xl font-extrabold text-pink-700 mb-2 text-center">
					{product.name}
				</h1>
				<p className="text-lg text-gray-700 mb-4 text-center">
					{product.description}
				</p>
				<div className="text-2xl font-bold text-indigo-700 mb-6">
					{product.price}
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
