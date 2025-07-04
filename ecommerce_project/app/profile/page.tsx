"use client";

import { withAuth, useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

interface ProfileData {
  name: string;
  email: string;
  orderHistory: { id: string; date: string; total: number }[];
  invoices: { id: string; date: string; total: number }[];
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await user?.getIdToken(); // Get Firebase ID token
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!profileData) {
    return <p>No profile data available.</p>;
  }

  const { name, email, orderHistory, invoices } = profileData;

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Profile</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Information</h2>
        <p className="text-lg text-gray-700">Name: {name}</p>
        <p className="text-lg text-gray-700">Email: {email}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
        <ul className="list-disc pl-6">
          {orderHistory.map((order) => (
            <li key={order.id} className="text-lg text-gray-700">
              {order.date} - ₹{order.total}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
        <ul className="list-disc pl-6">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="text-lg text-gray-700">
              Invoice #{invoice.id} - {invoice.date} - ₹{invoice.total}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default withAuth(ProfilePage);