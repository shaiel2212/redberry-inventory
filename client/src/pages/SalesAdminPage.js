import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Receipt, X } from 'lucide-react';
import { useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import SaleEditForm from '../components/sales/SaleEditForm';
import { toast } from 'react-toastify';

const SalesAdminPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [editDiscount, setEditDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const location = useLocation();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    clientId: '',
    sellerId: '',
    status: '',
    hasUnsupplied: '',
    startDate: '',
    endDate: '',
    minTotal: '',
    maxTotal: '',
  });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await saleService.getAllSales(filters);
        setSales(data);
      } catch (err) {
        setError('שגיאה בטעינת היסטוריית המכירות.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
    // eslint-disable-next-line
  }, [filters]);

  useEffect(() => {
    if (!loading && sales.length > 0) {
      const params = new URLSearchParams(location.search);
      const focusId = params.get("focus");
      if (focusId && sales.some(sale => sale.id === Number(focusId))) {
        fetchSaleDetails(Number(focusId));
      }
    }
    // eslint-disable-next-line
  }, [loading, sales, location.search]);

  const fetchSaleDetails = async (saleId) => {
    try {
      setSelectedSaleDetails(null);
      const data = await saleService.getSaleById(saleId);
      setSelectedSaleDetails(data);
      setDiscountPercent('');
      setDiscountAmount('');
      setDeliveryCost(data.delivery_cost || '');
    } catch (err) {
      setError(`שגיאה בטעינת פרטי מכירה ${saleId}.`);
      console.error(err);
    }
  };

  const handleUpdateSaleDetails = async () => {
    const discountType = discountPercent !== '' ? 'percent' : discountAmount !== '' ? 'amount' : null;
    const discountValue = discountType === 'percent' ? parseFloat(discountPercent) : parseFloat(discountAmount);
    const delivery = parseFloat(deliveryCost);

    if (discountType && (isNaN(discountValue) || discountValue < 0)) {
      setError('ערך הנחה לא תקין');
      return;
    }

    if (deliveryCost !== '' && (isNaN(delivery) || delivery < 0)) {
      setError('ערך עלות משלוח לא תקין');
      return;
    }

    try {
      await saleService.updateSaleDetails(selectedSaleDetails.id, {
        ...(discountType && { discount_type: discountType, discount_value: discountValue }),
        ...(deliveryCost !== '' && { delivery_cost: delivery }),
      });

      await fetchSaleDetails(selectedSaleDetails.id);
      setEditDiscount(false);
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון פרטי העסקה');
    }
  };

  const closeModal = () => {
    setSelectedSaleDetails(null);
    setEditDiscount(false);
    setIsEditMode(false); // איפוס מצב עריכה בסגירה
  };

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">ניהול מכירות</h2>
        {error && <p className="text-red-600">{error}</p>}
        {sales.length === 0 && !loading && <p>לא נמצאו מכירות.</p>}

        {/* Filters Bar */}
        <div className="mb-3 p-3 bg-white rounded-xl shadow text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              placeholder="חיפוש (שם לקוח / הערות / מספר מכירה)"
              className="border rounded p-2"
              value={filters.q}
              onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
            />
            <input
              type="date"
              className="border rounded p-2"
              value={filters.startDate}
              onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="border rounded p-2"
              value={filters.endDate}
              onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded"
              onClick={() => setFilters({ ...filters, q: '', startDate: '', endDate: '' })}
            >
              אפס
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">מספר מכירה</th>
                <th className="p-2 border">תאריך</th>
                <th className="p-2 border">לקוח</th>
                <th className="p-2 border">נמכר ע"י</th>
                <th className="p-2 border">סכום כולל</th>
                <th className="p-2 border">סה"כ לאחר הנחות</th>
                <th className="p-2 border">טופס הזמנה</th>
                <th className="p-2 border" >הערות</th>
                <th className="p-2 border">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="p-2 border">{sale.id}</td>
                  <td className="p-2 border">{new Date(sale.sale_date).toLocaleString('he-IL')}</td>
                  <td className="p-2 border">{sale.customer_name || '-'}</td>
                  <td className="p-2 border">{sale.sold_by || '-'}</td>
                  <td className="p-2 border">₪{parseFloat(sale.total_amount).toFixed(2)}</td>
                  <td className="p-2 border font-semibold text-green-700">₪{parseFloat(sale.final_amount || sale.total_amount).toFixed(2)}</td>
                  <td className="p-2 border text-center">
                    {sale.order_form_image ? (
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        {sale.order_form_image.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          // אייקון לתמונות
                          <a
                            href={sale.order_form_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="צפה בטופס הזמנה מקורי"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                        ) : sale.order_form_image.match(/\.pdf$/i) ? (
                          // אייקון ל-PDF
                          <a
                            href={sale.order_form_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="צפה ב-PDF הזמנה מקורי"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          </a>
                        ) : (
                          // אייקון לקבצים אחרים
                          <a
                            href={sale.order_form_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-800 text-sm"
                            title="צפה בקובץ הזמנה מקורי"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                        )}
                        
                        {/* כפתור עריכה */}
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.jpg,.jpeg,.png,.gif,.pdf';
                            input.onchange = async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                console.log('📁 File selected for edit (table):', { name: file.name, size: file.size, type: file.type });
                                
                                // הודעה על סוג הקובץ
                                if (file.type === 'application/pdf') {
                                  toast.success(`קובץ PDF "${file.name}" נבחר לעריכה!`);
                                } else {
                                  toast.success(`תמונת "${file.name}" נבחרה לעריכה!`);
                                }
                                
                                try {
                                  console.log('🔄 Replacing order form for sale (table):', sale.id);
                                  await saleService.uploadOrderForm(sale.id, file);
                                  console.log('✅ Replacement successful (table), refreshing sales list');
                                  // רענון הרשימה
                                  const updatedSales = await saleService.getAllSales();
                                  setSales(updatedSales);
                                  toast.success('קובץ הזמנה מקורי הוחלף בהצלחה!');
                                } catch (err) {
                                  console.error('❌ Replacement error in SalesAdminPage table:', err);
                                  toast.error('שגיאה בהחלפת קובץ ההזמנה');
                                }
                              }
                            };
                            input.click();
                          }}
                          className="text-yellow-600 hover:text-yellow-700 text-xs p-1 rounded hover:bg-yellow-50"
                          title="ערוך קובץ הזמנה"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <span className="text-gray-400 text-xs">אין</span>
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.jpg,.jpeg,.png,.gif,.pdf';
                            input.onchange = async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                console.log('📁 File selected (table):', { name: file.name, size: file.size, type: file.type });
                                
                                // הודעה על סוג הקובץ
                                if (file.type === 'application/pdf') {
                                  toast.success(`קובץ PDF "${file.name}" נבחר בהצלחה!`);
                                } else {
                                  toast.success(`תמונת "${file.name}" נבחרה בהצלחה!`);
                                }
                                
                                try {
                                  console.log('🔄 Calling uploadOrderForm for sale (table):', sale.id);
                                  await saleService.uploadOrderForm(sale.id, file);
                                  console.log('✅ Upload successful (table), refreshing sales list');
                                  // רענון הרשימה
                                  const updatedSales = await saleService.getAllSales();
                                  setSales(updatedSales);
                                  toast.success('קובץ הזמנה מקורי הועלה בהצלחה!');
                                } catch (err) {
                                  console.error('❌ Upload error in SalesAdminPage table:', err);
                                  toast.error('שגיאה בהעלאת קובץ ההזמנה');
                                }
                              }
                            };
                            input.click();
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                          title="הוסף טופס הזמנה מקורי"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-2 border">
                    {sale.notes || '-'}
                    {sale.has_unsupplied_items && (
                      <div className="text-xs text-red-600 mt-1">⚠️ כולל פריטים שטרם סופקו</div>
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => fetchSaleDetails(sale.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      הצג פרטים
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="border rounded-lg p-4 shadow-sm bg-white">
              <div><strong>מספר:</strong> {sale.id}</div>
              <div><strong>תאריך:</strong> {new Date(sale.sale_date).toLocaleString('he-IL')}</div>
              <div><strong>לקוח:</strong> {sale.customer_name || '-'}</div>
              <div><strong>נמכר ע"י:</strong> {sale.sold_by || '-'}</div>
              <div><strong>סכום:</strong> ₪{parseFloat(sale.total_amount).toFixed(2)}</div>
              <div><strong>אחרי הנחות:</strong> ₪{parseFloat(sale.final_amount || sale.total_amount).toFixed(2)}</div>
              <div><strong>טופס הזמנה:</strong> 
                {sale.order_form_image ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {sale.order_form_image.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      // אייקון לתמונות
                      <a
                        href={sale.order_form_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        צפה בתמונה
                      </a>
                    ) : sale.order_form_image.match(/\.pdf$/i) ? (
                      // אייקון ל-PDF
                      <a
                        href={sale.order_form_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-800 text-sm mr-2"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        צפה ב-PDF
                      </a>
                    ) : (
                      // אייקון לקבצים אחרים
                      <a
                        href={sale.order_form_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-800 text-sm mr-2"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        צפה בקובץ
                      </a>
                    )}
                    
                    {/* כפתור עריכה */}
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.jpg,.jpeg,.png,.gif,.pdf';
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            console.log('📁 File selected for edit (mobile):', { name: file.name, size: file.size, type: file.type });
                            
                            // הודעה על סוג הקובץ
                            if (file.type === 'application/pdf') {
                              toast.success(`קובץ PDF "${file.name}" נבחר לעריכה!`);
                            } else {
                              toast.success(`תמונת "${file.name}" נבחרה לעריכה!`);
                            }
                            
                            try {
                              console.log('🔄 Replacing order form for sale (mobile):', sale.id);
                              await saleService.uploadOrderForm(sale.id, file);
                              console.log('✅ Replacement successful (mobile), refreshing sales list');
                              // רענון הרשימה
                              const updatedSales = await saleService.getAllSales();
                              setSales(updatedSales);
                              toast.success('קובץ הזמנה מקורי הוחלף בהצלחה!');
                            } catch (err) {
                              console.error('❌ Replacement error in SalesAdminPage mobile:', err);
                              toast.error('שגיאה בהחלפת קובץ ההזמנה');
                            }
                          }
                        };
                        input.click();
                      }}
                      className="text-yellow-600 hover:text-yellow-700 text-xs p-1 rounded hover:bg-yellow-50"
                      title="ערוך קובץ הזמנה"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-gray-400 text-sm mr-2">אין</span>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.jpg,.jpeg,.png,.gif,.pdf';
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            console.log('📁 File selected (mobile):', { name: file.name, size: file.size, type: file.type });
                            
                            // הודעה על סוג הקובץ
                            if (file.type === 'application/pdf') {
                              toast.success(`קובץ PDF "${file.name}" נבחר בהצלחה!`);
                            } else {
                              toast.success(`תמונת "${file.name}" נבחרה בהצלחה!`);
                            }
                            
                            try {
                              console.log('🔄 Calling uploadOrderForm for sale (mobile):', sale.id);
                              await saleService.uploadOrderForm(sale.id, file);
                              console.log('✅ Upload successful (mobile), refreshing sales list');
                              // רענון הרשימה
                              const updatedSales = await saleService.getAllSales();
                              setSales(updatedSales);
                              toast.success('קובץ הזמנה מקורי הועלה בהצלחה!');
                            } catch (err) {
                              console.error('❌ Upload error in SalesAdminPage mobile:', err);
                              toast.error('שגיאה בהעלאת קובץ ההזמנה');
                            }
                          }
                        };
                        input.click();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                      title="הוסף טופס הזמנה מקורי"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {sale.has_unsupplied_items && (
                <div className="text-red-600 text-sm mt-1">⚠️ כולל פריטים שלא סופקו</div>
              )}
              <button
                onClick={() => fetchSaleDetails(sale.id)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded"
              >
                הצג פרטים
              </button>
            </div>
          ))}
        </div>

        {selectedSaleDetails && (
          <Dialog open={!!selectedSaleDetails} onClose={closeModal}>
            <DialogContent dir="rtl" className="text-right max-w-lg w-full p-6 rounded-3xl shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-center mb-4 relative">
                {/* כפתור X – בצד שמאל */}
                <button
                  onClick={closeModal}
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-blue-100 transition"
                  style={{ direction: 'ltr' }}
                  aria-label="סגור"
                >
                  <X className="w-7 h-7 text-gray-400 hover:text-blue-600" />
                </button>
                {/* כותרת ממורכזת */}
                <DialogTitle className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 justify-center w-full">
                  <Receipt className="w-7 h-7 text-blue-500" />
                  פרטי מכירה #{selectedSaleDetails.id}
                </DialogTitle>
              </div>
              {isEditMode ? (
                <SaleEditForm
                  sale={selectedSaleDetails}
                  onSave={async () => {
                    await fetchSaleDetails(selectedSaleDetails.id);
                    setIsEditMode(false);
                  }}
                  onCancel={() => setIsEditMode(false)}
                />
              ) : (
                <>
                  <div className="text-sm space-y-1 mb-4">
                    <p><strong>תאריך:</strong> {new Date(selectedSaleDetails.sale_date).toLocaleString('he-IL')}</p>
                    <p><strong>לקוח:</strong> {selectedSaleDetails.customer_name || '-'}</p>
                    <p><strong>נמכר ע"י:</strong> {selectedSaleDetails.sold_by || '-'}</p>
                    <p><strong>סכום כולל:</strong> ₪{parseFloat(selectedSaleDetails.total_amount).toFixed(2)}</p>
                    <p><strong>הנחה באחוזים:</strong> {selectedSaleDetails.discount_percent || 0}%</p>
                    <p><strong>הנחה בש"ח:</strong> ₪{selectedSaleDetails.discount_amount || 0}</p>
                    <p><strong>סה"כ לאחר הנחה:</strong> ₪{parseFloat(selectedSaleDetails.final_amount || selectedSaleDetails.total_amount).toFixed(2)}</p>
                    <p><strong>עלות משלוח:</strong> ₪{parseFloat(selectedSaleDetails.delivery_cost || 0).toFixed(2)}</p>
                    <p className="font-bold text-blue-700">סה"כ לאחר הנחה ומשלוח: ₪{(parseFloat(selectedSaleDetails.final_amount || selectedSaleDetails.total_amount) - parseFloat(selectedSaleDetails.delivery_cost || 0)).toFixed(2)} <span className="text-xs text-gray-500">(כולל משלוח)</span></p>
                    {selectedSaleDetails.discount_given_by && (
                      <p><strong>ניתנה ע"י:</strong> {selectedSaleDetails.discount_given_by}</p>
                    )}
                    {selectedSaleDetails.discount_given_at && (
                      <p><strong>בתאריך:</strong> {new Date(selectedSaleDetails.discount_given_at).toLocaleString('he-IL')}</p>
                    )}
                  </div>
                  {selectedSaleDetails.has_unsupplied_items && (
                    <div className="text-red-600 text-sm mt-2">
                      ⚠️ מכירה זו כוללת פריטים שטרם סופקו (חסר מלאי)
                    </div>
                  )}
                  {selectedSaleDetails.notes && (
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>הערות:</strong> {selectedSaleDetails.notes}
                    </div>
                  )}
                  
                  {selectedSaleDetails.order_form_image && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-800">📋 טופס הזמנה מקורי</h4>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => document.getElementById('orderFormEditModal').click()}
                            className="text-yellow-600 hover:text-yellow-700 text-sm p-1 rounded hover:bg-yellow-50"
                            title="ערוך קובץ הזמנה"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <a
                          href={selectedSaleDetails.order_form_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title={selectedSaleDetails.order_form_image.match(/\.pdf$/i) ? 'צפה ב-PDF' : 'צפה בתמונה'}
                        >
                          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {selectedSaleDetails.order_form_image.match(/\.pdf$/i) ? 'צפה ב-PDF' : 'צפה בתמונה'}
                        </a>
                      </div>
                      
                      {/* קובץ נסתר לעריכה */}
                      <input
                        type="file"
                        id="orderFormEditModal"
                        accept=".jpg,.jpeg,.png,.gif,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              await saleService.uploadOrderForm(selectedSaleDetails.id, file);
                              await fetchSaleDetails(selectedSaleDetails.id);
                              if (file.type === 'application/pdf') {
                                toast.success('קובץ PDF הזמנה מקורי הוחלף בהצלחה!');
                              } else {
                                toast.success('תמונת הזמנה מקורי הוחלפה בהצלחה!');
                              }
                            } catch (err) {
                              toast.error('שגיאה בהחלפת קובץ ההזמנה');
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                  
                  <h4 className="mt-4 font-semibold">📦 פריטים במכירה:</h4>
                  <ul className="list-disc pr-5 text-sm mt-1 space-y-1">
                    {selectedSaleDetails.items.map(item => (
                      <li key={item.product_id}>
                        {item.product_name || item.name} — כמות: {item.quantity}, ₪{parseFloat(item.sale_price || item.price_per_unit).toFixed(2)} ליחידה
                      </li>
                    ))}
                  </ul>
                  {user?.role === 'admin' && !['delivered', 'cancelled'].includes(selectedSaleDetails.status) && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="mb-2 bg-yellow-400 hover:bg-yellow-500 text-black w-full py-2 rounded"
                    >
                      ערוך
                    </button>
                  )}
                  
                  {!selectedSaleDetails.order_form_image && (
                    <button
                      onClick={() => document.getElementById('orderFormUpload').click()}
                      className="mb-2 bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      הוסף טופס הזמנה מקורי
                    </button>
                  )}
                  
                  <input
                    type="file"
                    id="orderFormUpload"
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          await saleService.uploadOrderForm(selectedSaleDetails.id, file);
                          await fetchSaleDetails(selectedSaleDetails.id);
                          if (file.type === 'application/pdf') {
                            toast.success('קובץ PDF הזמנה מקורי הועלה בהצלחה!');
                          } else {
                            toast.success('תמונת הזמנה מקורי הועלתה בהצלחה!');
                          }
                        } catch (err) {
                          toast.error('שגיאה בהעלאת קובץ ההזמנה');
                        }
                      }
                    }}
                    className="hidden"
                  />
                  
                  <button
                    onClick={closeModal}
                    className="mt-2 bg-gray-800 hover:bg-gray-900 text-white w-full py-2 rounded"
                  >
                    סגור פרטים
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded font-bold mt-2"
                    >
                      מחק מכירה
                    </button>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
        {/* דיאלוג אישור מחיקה */}
        {showDeleteDialog && selectedSaleDetails && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent dir="rtl" className="text-right max-w-md w-full p-6 rounded-3xl shadow-2xl bg-white border border-red-300 max-h-[85vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-red-700 mb-2">אזהרה!</h3>
              <p className="mb-4">האם אתה בטוח שברצונך למחוק את המכירה #{selectedSaleDetails.id} של <b>{selectedSaleDetails.customer_name}</b>? פעולה זו בלתי הפיכה!</p>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await saleService.deleteSale(selectedSaleDetails.id);
                      setShowDeleteDialog(false);
                      setSelectedSaleDetails(null);
                      setSales(sales.filter(sale => sale.id !== selectedSaleDetails.id));
                      alert('המכירה נמחקה בהצלחה');
                    } catch (err) {
                      alert('שגיאה במחיקת המכירה');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
                  disabled={deleting}
                >
                  מחק
                </button>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold"
                  disabled={deleting}
                >
                  בטל
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </MainLayout>
  );
};

export default SalesAdminPage;
