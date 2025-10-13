import React from "react";

interface ProductProps {
  product: {
    data: {
      attributes: {
        name: string;
        description: string;
        price: number;
        image?: {
          data?: {
            attributes: {
              url: string;
            };
          };
        };
      };
    };
  };
}

const ProductPage: React.FC<ProductProps> = ({ product }) => {
  const attributes = product?.data?.attributes;
  if (!attributes) {
    return <div className="p-8 text-center text-red-500">Product not found.</div>;
  }
  const imageUrl = attributes.image?.data?.attributes?.url
  ? `${process.env.EXT_PUBLIC_STRAPI_UR}${attributes.image.data.attributes.url}`
    : null;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{attributes.name}</h1>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={attributes.name}
          className="w-64 h-64 object-cover mb-4 rounded"
        />
      )}
      <p className="mb-2 text-gray-700">{attributes.description}</p>
      <p className="font-bold text-indigo-600 mb-2">₹{attributes.price}</p>
    </div>
  );
};

export async function getServerSideProps() {
  const res = await fetch(`${process.env.EXT_PUBLIC_STRAPI_UR}/api/product?populate=*`);
  const product = await res.json();

  return {
    props: {
      product,
    },
  };
}

export default ProductPage;
