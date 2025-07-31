import React, { useState } from 'react';
import { MapPin, CheckCircle2, FileText, FileCheck2, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';

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

const DeliveryCard = ({ delivery, user, openDetails, onEditSale }) => {
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const hasUnsigned = Boolean(delivery.delivery_proof_url);
  const hasSigned = Boolean(delivery.delivery_proof_signed_url);

  let badgeColor = 'bg-red-100 border-red-300';
  if (hasUnsigned && !hasSigned) badgeColor = 'bg-yellow-100 border-yellow-300';
  if (hasSigned) badgeColor = 'bg-green-100 border-green-300';

  return (
    <div
      dir="rtl"
      className={`border-2 rounded-2xl shadow-md bg-white p-4 space-y-3 ${badgeColor} text-right flex flex-col justify-between h-full relative min-h-[280px] md:min-h-[360px]`}
    >
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

      {/* כפתור פרטים תמיד בתחתית, כפתור פרטי העסקה מוצמד שמאלה */}
      <div className="mt-auto space-y-2">
        {/* שורה ראשונה - כפתורי עדכון ופרטי העסקה */}
        <div className="flex justify-between items-center w-full gap-2">
          <Button
            size="xs"
            variant="default"
            onClick={() => openDetails(delivery)}
            className="rounded-md font-bold min-w-[80px] min-h-[28px] text-xs flex-1"
          >
            עדכון משלוח
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowSaleDetails(true)}
            className="rounded-md border-2 border-gray-500 text-gray-800 font-bold bg-white hover:bg-gray-100 hover:border-gray-700 transition min-w-[80px] min-h-[28px] text-xs flex-1"
          >
            פרטי העסקה
          </Button>
        </div>
        
        {/* שורה שנייה - כפתור עריכה מכירה - רק למנהלים */}
        {user?.role === 'admin' && onEditSale && (
          <div className="w-full">
            <Button
              size="xs"
              variant="outline"
              onClick={() => onEditSale(delivery.sale_id)}
              className="w-full rounded-md border-2 border-blue-500 text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 hover:border-blue-600 transition min-h-[28px] text-xs flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              ערוך מכירה
            </Button>
          </div>
        )}
      </div>

      {/* דיאלוג פרטי העסקה */}
      {showSaleDetails && (
        <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
          <DialogContent className="text-right space-y-3 p-6">
            <h2 className="text-xl font-bold mb-2">
              פרטי עסקה #{delivery.sale_id}
            </h2>
            <div className="space-y-2 text-base">
              <div>
                <span className="font-semibold">שם בית עסק:</span> {delivery.customer_name}
              </div>
              <div>
                <span className="font-semibold">כתובת:</span> {delivery.address}
              </div>
              <div>
                <span className="font-semibold">טלפון:</span> {delivery.phone || '-'}
              </div>
              <div>
                <span className="font-semibold">הערות:</span> {delivery.notes || '-'}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowSaleDetails(false)}
                className="rounded-md font-bold min-w-[80px] min-h-[28px] text-xs"
              >
                סגור
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeliveryCard;
