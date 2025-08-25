import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { toast } from 'react-hot-toast';

const MySalesPage = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMySales = async () => {
            try {
                setLoading(true);

                // ודא שהטוקן מוזרק
                const token = authService.getToken();
                if (!token) {
                    setError('⚠️ לא נמצא טוקן התחברות.');
                    setLoading(false);
                    return;
                }
                authService.setAuthToken(token);

                const data = await saleService.getMySales();
                setSales(data);
            } catch (err) {
                console.error('❌ שגיאה בטעינת המכירות האישיות:', err);
                setError('שגיאה בטעינת המכירות האישיות.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'seller' || user?.role === 'admin') {
            fetchMySales();
        }
    }, [user]);

    return (
        <MainLayout>
            <div className="p-4 max-w-4xl mx-auto text-right">
                <h2 className="text-xl font-bold mb-4">המכירות שלי</h2>

                {error && <p className="text-red-600 font-semibold mb-4">{error}</p>}

                {loading ? (
                    <p>⏳ טוען נתונים...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2 whitespace-nowrap">מספר</th>
                                    <th className="border p-2 whitespace-nowrap">תאריך</th>
                                    <th className="border p-2 whitespace-nowrap">לקוח</th>
                                    <th className="border p-2 whitespace-nowrap">סכום</th>
                                    <th className="border p-2 whitespace-nowrap">טופס הזמנה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="border-t hover:bg-gray-50">
                                        <td className="border p-2 text-center">{sale.id}</td>
                                        <td className="border p-2 text-center">{new Date(sale.sale_date).toLocaleDateString('he-IL')}</td>
                                        <td className="border p-2">{sale.customer_name}</td>
                                        <td>
                                            ₪{isNaN(Number(sale.total_amount))
                                                ? '0.00'
                                                : Number(sale.total_amount).toFixed(2)
                                            }
                                        </td>
                                        <td className="border p-2 text-center">
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
                                                        onClick={() => document.getElementById(`orderFormEdit_${sale.id}`).click()}
                                                        className="text-yellow-600 hover:text-yellow-700 text-xs p-1 rounded hover:bg-yellow-50"
                                                        title="ערוך קובץ הזמנה"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    <input
                                                        type="file"
                                                        id={`orderFormEdit_${sale.id}`}
                                                        accept=".jpg,.jpeg,.png,.gif,.pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                // הודעה על סוג הקובץ
                                                                if (file.type === 'application/pdf') {
                                                                    toast.success(`קובץ PDF "${file.name}" נבחר לעריכה!`);
                                                                } else {
                                                                    toast.success(`תמונת "${file.name}" נבחרה לעריכה!`);
                                                                }
                                                                
                                                                try {
                                                                    await saleService.uploadOrderForm(sale.id, file);
                                                                    // רענון הרשימה
                                                                    const updatedSales = await saleService.getMySales();
                                                                    setSales(updatedSales);
                                                                    toast.success('קובץ הזמנה מקורי הוחלף בהצלחה!');
                                                                } catch (err) {
                                                                    toast.error('שגיאה בהחלפת קובץ ההזמנה');
                                                                }
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                                    <span className="text-gray-400 text-xs">אין</span>
                                                    <button
                                                        onClick={() => document.getElementById(`orderFormUpload_${sale.id}`).click()}
                                                        className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                                                        title="הוסף טופס הזמנה מקורי"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                    <input
                                                        type="file"
                                                        id={`orderFormUpload_${sale.id}`}
                                                        accept=".jpg,.jpeg,.png,.gif,.pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                // הודעה על סוג הקובץ
                                                                if (file.type === 'application/pdf') {
                                                                    toast.success(`קובץ PDF "${file.name}" נבחר בהצלחה!`);
                                                                } else {
                                                                    toast.success(`תמונת "${file.name}" נבחרה בהצלחה!`);
                                                                }
                                                                
                                                                try {
                                                                    await saleService.uploadOrderForm(sale.id, file);
                                                                    // רענון הרשימה
                                                                    const updatedSales = await saleService.getMySales();
                                                                    setSales(updatedSales);
                                                                    toast.success('קובץ הזמנה מקורי הועלה בהצלחה!');
                                                                } catch (err) {
                                                                    toast.error('שגיאה בהעלאת קובץ ההזמנה');
                                                                }
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};






export default MySalesPage;