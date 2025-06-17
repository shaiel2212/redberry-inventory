import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

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