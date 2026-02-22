import Link from "next/link";

export default function EthnicWearPage() {
  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 text-center">
      <h1 className="text-3xl md:text-4xl font-extrabold text-pink-700 mb-4">
        Ethnic Wear
      </h1>
      <p className="text-lg md:text-xl text-gray-700 mb-8">
        Embrace tradition with a modern twist! Discover our exclusive collection
        of ethnic wear, designed to make you feel elegant and confident at every
        celebration. From vibrant colors to intricate patterns, find the perfect
        outfit for every occasion.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        <Link href="/products/ethnic_wear/kurthis" passHref>
          <div className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col items-center">
            <img
              src="/images/Kurthis.jpg"
              alt="Kurthis"
              className="w-full h-48 object-cover object-top rounded-md mb-3"
            />
            <h2 className="text-xl font-semibold text-pink-600">Kurthis</h2>
            <p className="text-gray-600 text-sm mt-1">
              Chic, comfortable, and perfect for every day or festive moments.
            </p>
          </div>
        </Link>
        <Link href="/products/ethnic_wear/lehengas" passHref>
          <div className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col items-center">
            <img
              src="/images/Lehengas.jpg"
              alt="Lehengas"
              className="w-full h-48 object-cover object-top rounded-md mb-3"
            />
            <h2 className="text-xl font-semibold text-pink-600">Lehengas</h2>
            <p className="text-gray-600 text-sm mt-1">
              Graceful silhouettes and dazzling designs for special occasions.
            </p>
          </div>
        </Link>
        <Link href="/products/ethnic_wear/sarees" passHref>
          <div className="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-4 flex flex-col items-center">
            <img
              src="/images/Sarees.jpg"
              alt="Sarees"
              className="w-full h-48 object-cover object-top rounded-md mb-3"
            />
            <h2 className="text-xl font-semibold text-pink-600">Sarees</h2>
            <p className="text-gray-600 text-sm mt-1">
              Timeless elegance in every drape, for the modern woman.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}