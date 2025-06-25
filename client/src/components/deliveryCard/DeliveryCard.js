import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../ui/button';

const DeliveryCard = ({ delivery, openDetails }) => {
  return (
    <div className="border rounded-2xl shadow p-4 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-lg">#{delivery.sale_id} - {delivery.customer_name}</h4>
        <span className="text-sm text-gray-500">{delivery.status}</span>
      </div>

      <div className="text-sm space-y-1">
        <p><strong>כתובת:</strong> {delivery.address || '-'}</p>
        <p><strong>מוצר:</strong> {delivery.product_name}</p>
        <p><strong>כמות:</strong> {delivery.quantity}</p>
        <p><strong>נמכר ע"י:</strong> {delivery.seller_name}</p>
        {delivery.delivery_proof_url && <p className="text-blue-600 underline">📎 תעודה</p>}
        {delivery.delivery_proof_signed_url && <p className="text-green-600 underline">📎 חתומה</p>}
      </div>

      <div className="mt-3 text-left">
        <Button onClick={() => openDetails(delivery)}>פרטים</Button>
      </div>
    </div>
  );
};

export default DeliveryCard;
