import React from 'react';
import { MapPin, CheckCircle2, FileText, FileCheck2 } from 'lucide-react';
import { Button } from '../ui/button';

const getStatusLabel = (statusValue) => {
  switch (statusValue) {
    case 'pending': return 'ממתין';
    case 'delivered': return 'סופק';
    case 'awaiting_stock': return 'חסר במלאי';
    case 'assigned': return 'הוקצה לשליח';
  ;
    default: return statusValue;
  }
};

const DeliveryCard = ({ delivery, user, openDetails }) => {
  const hasUnsigned = Boolean(delivery.delivery_proof_url);
  const hasSigned = Boolean(delivery.delivery_proof_signed_url);

  let badgeColor = 'bg-red-100 border-red-300';
  if (hasUnsigned && !hasSigned) badgeColor = 'bg-yellow-100 border-yellow-300';
  if (hasSigned) badgeColor = 'bg-green-100 border-green-300';

  return (
    <div dir="rtl" className={`border-2 rounded-2xl shadow-md bg-white p-4 space-y-3 ${badgeColor} text-right flex flex-col justify-between h-full relative`}> {/* RTL container */}
      <div>
        <div className="flex justify-between items-center flex-row-reverse"> {/* RTL row */}
          <h4 className="font-bold text-base">
            הזמנה #{delivery.sale_id}
          </h4>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            <span>{getStatusLabel(delivery.status)}</span>
          </span>
        </div>

        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>לקוח:</strong> <bdi>{delivery.customer_name}</bdi></p>
          {delivery.address && (
            <p className="flex items-center gap-1 flex-row-reverse">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{delivery.address}</span>
            </p>
          )}
          {/* הצגת כל מוצר וכמות בשורה נפרדת */}
          {delivery.product_names && delivery.product_names.split(', ').map((name, idx) => (
            <div key={idx} className="text-sm text-gray-700">
              <p><strong>מוצר:</strong> {name}</p>
              <p><strong>כמות:</strong> {delivery.quantities.split(', ')[idx]}</p>
            </div>
          ))}
          <p><strong>נמכר ע״י:</strong> {delivery.seller_name}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm justify-end">
          {hasUnsigned && (
            <a href={delivery.delivery_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1 flex-row-reverse">
              <FileText className="w-4 h-4" /> טיוטה
            </a>
          )}
          {hasSigned && (
            <a href={delivery.delivery_proof_signed_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline flex items-center gap-1 flex-row-reverse">
              <FileCheck2 className="w-4 h-4" /> חתומה
            </a>
          )}
        </div>
      </div>

      {/* כפתור פרטים תמיד בתחתית שמאל */}
      <div className="mt-auto flex justify-start items-end w-full">
        <Button
          size="sm"
          variant="default"
          onClick={() => openDetails(delivery)}
          className="rounded-md mt-2"
        >
          פרטים
        </Button>
      </div>
    </div>
  );
};

export default DeliveryCard;
