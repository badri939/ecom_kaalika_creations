import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <>
      <div className="relative w-full h-screen">
        <Image
          src="/images/hero.webp"
          alt="Hero Image"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 sm:px-2 animate-fade-in">
          <h1 className="text-3xl sm:text-2xl md:text-5xl font-extrabold text-center drop-shadow-lg">
            Welcome to Kaalika Creations
          </h1>
          <p className="text-base sm:text-sm md:text-lg text-center mt-2 drop-shadow-md">
            Discover the latest trends in fashion
          </p>
          <Link href="/products" passHref>
            <button className="mt-6 px-6 sm:px-4 py-3 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:scale-105 transform transition-transform duration-300 text-sm sm:text-xs md:text-base shadow-lg">
              Shop Now
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-12 px-6 text-center">
        <h2 className="text-2xl sm:text-xl md:text-3xl font-bold text-gray-800">
          Explore Our Categories
        </h2>
        <p className="text-sm sm:text-xs md:text-base text-gray-600 mt-2">
          Find the perfect outfit for every occasion
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Link href="/products/ethnic_wear" passHref>
            <div className="cursor-pointer">
              <img
                src="/images/Ethnic_wear.jpg"
                alt="Ethnic Wear"
                className="w-full h-48 object-cover object-top rounded-lg shadow-md hover:scale-105 transform transition-transform duration-300"
              />
              <p className="mt-2 text-lg font-semibold text-gray-700">Ethnic Wear</p>
            </div>
          </Link>
          <Link href="/products/party_wear" passHref>
            <div className="cursor-pointer">
              <img
                src="/images/Party_wear.jpg"
                alt="Party Wear"
                className="w-full h-48 object-cover object-top rounded-lg shadow-md hover:scale-105 transform transition-transform duration-300"
              />
              <p className="mt-2 text-lg font-semibold text-gray-700">Party Wear</p>
            </div>
          </Link>
          <Link href="/products/bridal_wear" passHref>
            <div className="cursor-pointer">
              <img
                src="/images/Bridal_Wear.jpg"
                alt="Bridal Wear"
                className="w-full h-48 object-cover object-top rounded-lg shadow-md hover:scale-105 transform transition-transform duration-300"
              />
              <p className="mt-2 text-lg font-semibold text-gray-700">Bridal Wear</p>
            </div>
          </Link>
          <Link href="/products/casual_wear" passHref>
            <div className="cursor-pointer">
              <img
                src="/images/Casual_Wear.jpg"
                alt="Casual Wear"
                className="w-full h-48 object-cover object-top rounded-lg shadow-md hover:scale-105 transform transition-transform duration-300"
              />
              <p className="mt-2 text-lg font-semibold text-gray-700">Casual Wear</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
