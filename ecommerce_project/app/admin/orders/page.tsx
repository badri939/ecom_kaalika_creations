"use client";

import { useEffect, useState } from "react";

function getAdminSecret() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("ADMIN_SECRET") || null;
}

export default function AdminOrdersPage() {
  const [secret, setSecret] = useState<string | null>(getAdminSecret());
  const [count, setCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!secret) return;
    let mounted = true;
    const headers = { Authorization: `Bearer ${secret}` };

    async function fetchNotifications() {
      try {
        const res = await fetch('/api/admin/notifications', { headers });
        const j = await res.json();
        if (!mounted) return;
        setNotifications(j.notifications || []);
      } catch (err) {
        console.error('fetch notifications failed', err);
      }
    }

    fetchNotifications();
    const iv = setInterval(fetchNotifications, 20_000);
    return () => { mounted = false; clearInterval(iv); };
  }, [secret]);

  useEffect(() => {
    if (!secret) return;
    let mounted = true;
    const headers = { Authorization: `Bearer ${secret}` };

    async function pollCount() {
      try {
        const res = await fetch('/api/admin/unread-count', { headers });
        const j = await res.json();
        if (!mounted) return;
        if (j.count > count) {
          // new notifications
          if (Notification && Notification.permission === 'granted') {
            new Notification('New order received', { body: `You have ${j.count} unread orders` });
          }
        }
        setCount(j.count || 0);
      } catch (err) {
        console.error('poll count failed', err);
      }
    }

    pollCount();
    const iv = setInterval(pollCount, 20_000);
    return () => { mounted = false; clearInterval(iv); };
  }, [secret, count]);

  function saveSecret(s: string) {
    try { sessionStorage.setItem('ADMIN_SECRET', s); } catch {}
    setSecret(s);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Orders</h1>
      {!secret ? (
        <div className="space-y-2">
          <p>Enter ADMIN_SECRET to view admin notifications (session-only).</p>
          <input type="password" id="admin-secret" className="border p-2" placeholder="Paste ADMIN_SECRET here" />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => {
            const el = document.getElementById('admin-secret') as HTMLInputElement | null; if (!el) return; saveSecret(el.value);
          }}>Unlock</button>
        </div>
      ) : (
        <div>
          <div className="mb-4">Unread: <strong>{count}</strong></div>
          <div className="grid gap-3">
            {notifications.map(n => (
              <div key={n.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">Order {n.payload?.orderId || '—'}</div>
                    <div className="text-sm text-gray-600">{n.payload?.customerEmail || n.payload?.email || ''}</div>
                    <div className="text-sm">Amount: ₹{n.payload?.totalCost || n.payload?.total || 'N/A'}</div>
                  </div>
                  <div>
                    <a href={`/admin/orders/${n.id}`} className="px-3 py-1 bg-green-500 text-white rounded">Open</a>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">{n.createdAt?.toDate ? n.createdAt.toDate().toString() : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
