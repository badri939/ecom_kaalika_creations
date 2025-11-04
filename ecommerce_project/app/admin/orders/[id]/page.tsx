"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';

function getAdminSecret() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("ADMIN_SECRET") || null;
}

// Keep props loosely typed for the client-side admin page to avoid App Router PageProps mismatch
// (the App Router expects different PageProps shapes depending on server/client components).
// Using `any` here is a pragmatic choice to unblock the build; we can tighten types later.
export default function OrderDetailPage({ params }: any) {
  const { id } = params;
  const [secret, setSecret] = useState<string | null>(getAdminSecret());
  const [notification, setNotification] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSecret(getAdminSecret());
  }, []);

  useEffect(() => {
    if (!secret) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${secret}` } });
        const j = await res.json();
        if (!mounted) return;
        const found = (j.notifications || []).find((n: any) => n.id === id);
        setNotification(found || null);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [secret, id]);

  async function generateAndDownload() {
    if (!secret) { setMessage('Missing ADMIN_SECRET. Open /admin/orders and unlock.'); return; }
    setLoading(true); setMessage(null);
    try {
      const res = await fetch('/api/admin/razorpay-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ notificationId: id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || JSON.stringify(j));
      const invoiceId = j.id || j.invoiceId || j.invoice?.id;
      if (!invoiceId) throw new Error('no invoice id returned');

      // fetch PDF from server proxy
      const pdfRes = await fetch(`/api/admin/razorpay-pdf?id=${encodeURIComponent(invoiceId)}`, { headers: { Authorization: `Bearer ${secret}` } });
      if (!pdfRes.ok) {
        const txt = await pdfRes.text(); throw new Error(txt || 'failed to get pdf');
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Invoice downloaded');
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || String(err));
    } finally { setLoading(false); }
  }

  if (!secret) return (
    <div className="p-6">
      <p>ADMIN_SECRET not set for this session. Go to <a href="/admin/orders">/admin/orders</a> and paste it to unlock.</p>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Order / Notification {id}</h1>
      {!notification ? (
        <div>Loading notification...</div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 border rounded">
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(notification.payload, null, 2)}</pre>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={generateAndDownload} disabled={loading}>{loading ? 'Generating...' : 'Generate & Download Invoice'}</button>
            {notification.invoice?.short_url ? <a className="px-4 py-2 bg-gray-200 rounded" href={notification.invoice.short_url} target="_blank">Open invoice.link</a> : null}
          </div>
          {message ? <div className="text-sm text-red-600">{message}</div> : null}
        </div>
      )}
    </div>
  );
}
