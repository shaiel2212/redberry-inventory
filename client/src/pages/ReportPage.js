import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import jobsService from '../services/jobsService';
import MainLayout from '../components/layout/MainLayout';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FileText, RefreshCw } from 'lucide-react';

const SalesReportPage = () => {
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [summary, setSummary] = useState(null);
    const [viewMode, setViewMode] = useState("default");
    const [mattressSummaryData, setMattressSummaryData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);

    const { user } = useAuth();


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const filters = {};
                if (startDate) filters.startDate = startDate;
                if (endDate) filters.endDate = endDate;
                const data = await saleService.getSalesReport(filters);
                setReportData(data);
                setFilteredData(data);
            } catch (err) {
                setError('שגיאה בטעינת הדוח.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [startDate, endDate]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = reportData.filter(row =>
            row.customer_name?.toLowerCase().includes(term) ||
            row.product_name?.toLowerCase().includes(term) ||
            row.sold_by?.toLowerCase().includes(term)
        );
        setFilteredData(filtered);
    }, [searchTerm, reportData]);

    const handleSort = (field) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        const sorted = [...filteredData].sort((a, b) => {
            const aVal = a[field] ?? '';
            const bVal = b[field] ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return direction === 'asc'
                ? aVal.toString().localeCompare(bVal.toString())
                : bVal.toString().localeCompare(aVal.toString());
        });
        setSortField(field);
        setSortDirection(direction);
        setFilteredData(sorted);
    };

    const exportToExcel = () => {
        // הגדרת שמות עמודות בעברית
        const headers = [
            "מספר עסקה",
            "תאריך",
            "לקוח",
            "מוצר",
            "כמות",
            "מחיר ליחידה",
            "סכום כולל",
            "הנחה",
            "סכום לאחר הנחה",
            "מוכר",
            "עלות מוצר",
            "רווח פריט",
            "עלות משלוח",
            "הערות",
            "רווח כולל" // עכשיו בסוף!
        ];
        // המרת הנתונים למבנה תואם כותרות
        const data = filteredData.map(row => ([
            row.sale_id,
            row.sale_date ? new Date(row.sale_date).toLocaleDateString('he-IL') : '',
            row.customer_name,
            row.product_name,
            row.quantity,
            row.price_per_unit,
            row.total_amount,
            row.discount_percent || row.discount_amount || '',
            row.final_amount || '',
            row.sold_by,
            row.cost_price,
            // רווח פר פריט
            (Number(row.price_per_unit || 0) - Number(row.cost_price || 0)).toFixed(2),
            row.delivery_cost,
            row.notes,
            // רווח כולל (בסוף)
            ((Number(row.price_per_unit || 0) - Number(row.cost_price || 0)) * Number(row.quantity || 0)).toFixed(2)
        ]));
        // הוספת headers כראשונה
        const worksheetData = [headers, ...data];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'דוח מכירות');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'sales_report.xlsx');
    };

    const exportToPDF = () => {
        window.print();
    };

    const calculateSummary = () => {
        const totalDiscount = filteredData.reduce((sum, row) => {
            const total = Number(row.total_amount) || 0;
            const final = Number(row.final_amount) || total;
            return sum + (total - final);
        }, 0);
        const totalDelivery = groupedArray.reduce((sum, row) => sum + (Number(row.delivery_cost) || 0), 0);
        const totalProfit = filteredData.reduce((sum, row) => sum + (Number(row.final_profit || row.total_profit) || 0), 0);
        setSummary({
            totalDiscount: totalDiscount.toFixed(2),
            totalDelivery: totalDelivery.toFixed(2),
            totalProfit: totalProfit.toFixed(2),
        });
        setShowSummary(true);
    };

    const calculateMattressSummary = () => {
        const mattressData = filteredData.filter(row => 
            row.product_name && row.product_name.toLowerCase().includes('מזרן')
        );
        const summary = {};
        mattressData.forEach(item => {
            const key = item.product_name || 'לא ידוע';
            summary[key] = (summary[key] || 0) + (Number(item.quantity) || 0);
        });
        setMattressSummaryData(summary);
        setViewMode("mattressSummary");
    };

    const handleGenerateMonthlyReport = async () => {
        try {
            setGlobalLoading(true);
            const result = await jobsService.runGenerateMonthlyReport();
            
            if (result.success) {
                toast.success(result.message || 'דוח חודשי נוצר ונשלח בהצלחה');
            } else {
                toast.error(result.message || 'שגיאה ביצירת דוח חודשי');
            }
        } catch (err) {
            console.error('שגיאה ביצירת דוח חודשי:', err);
            toast.error('שגיאה ביצירת דוח חודשי');
        } finally {
            setGlobalLoading(false);
        }
    };


    // קיבוץ לפי sale_id
    const groupedData = filteredData.reduce((acc, row) => {
        if (!acc[row.sale_id]) {
            acc[row.sale_id] = {
                ...row,
                items: [],
                total_profit: 0,
            };
        }
        acc[row.sale_id].items.push(row);
        acc[row.sale_id].total_profit += Number(row.final_profit || row.total_profit) || 0;
        return acc;
    }, {});
    const groupedArray = Object.values(groupedData);
    // מיין לפי תאריך מהחדש לישן
    const sortedGroupedArray = groupedArray.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    // מיין גם למובייל
    const sortedGroupedArrayMobile = groupedArray.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

    return (
        <MainLayout>
            <div dir="rtl" className="p-4 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">דוח מכירות מפורט</h1>
                {error && <p className="text-red-600">{error}</p>}
                {loading && <p className="text-blue-600">⏳ טוען נתונים...</p>}

                <div className="flex flex-wrap gap-4 mb-4 items-center">
                    <input type="text" placeholder="חפש לפי לקוח, מוצר או מוכר..." className="p-2 border rounded w-64"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <input type="date" className="p-2 border rounded" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)} />
                    <input type="date" className="p-2 border rounded" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)} />
                    <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">ייצוא לאקסל</button>
                    <button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">ייצוא ל־PDF</button>
                </div>

                <div className="flex gap-4 mb-4">
                    <button onClick={calculateSummary} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">חשב סיכומים</button>
                    <button onClick={calculateMattressSummary} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">סיכום לפי סוגי מזרנים</button>
                    {viewMode === 'mattressSummary' && (
                        <button onClick={() => setViewMode("default")} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">חזור לדוח המלא</button>
                    )}
                    {/* כפתור יצירת דוח חודשי - רק למנהלים */}
                    {user?.role === 'admin' && (
                        <button 
                            onClick={handleGenerateMonthlyReport}
                            disabled={globalLoading}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            {globalLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    יוצר דוח...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    צור דוח חודשי
                                </>
                            )}
                        </button>
                    )}
                </div>

                {showSummary && summary && (
                    <div className="mt-6 p-4 bg-gray-50 border rounded shadow-sm text-sm leading-6">
                        <p>💰 <b>סה"כ הנחות:</b> ₪{summary.totalDiscount}</p>
                        <p>🚚 <b>סה"כ עלויות משלוח:</b> ₪{summary.totalDelivery}</p>
                        <p>📈 <b>רווח כולל לתקופה:</b> ₪{summary.totalProfit}</p>
                        {showSummary && (
                            <button
                                onClick={() => setShowSummary(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                            >
                                סגור סיכום
                            </button>
                        )}
                    </div>
                )}

                {viewMode === "default" && (
                    isMobile ? (
                        <div className="space-y-8">
                            {sortedGroupedArrayMobile.map((sale, idx) => (
                                <div key={sale.sale_id} className="border rounded-2xl shadow-md bg-white p-4 text-right rtl">
                                    {/* כותרת עסקה */}
                                    <div className="mb-3 space-y-1 text-right rtl">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold text-lg rtl">
                                            <a href={`#sale-${sale.sale_id}`} className="text-blue-600 underline">הזמנה #{sale.sale_id}</a>
                                            <span className="text-gray-500 text-base font-normal">{new Date(sale.sale_date).toLocaleDateString('he-IL')} <span className="ml-1">📅</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm rtl">
                                            <span>{sale.customer_name} <span className="ml-1">👤</span></span>
                                            <span className="mx-2">|</span>
                                            <span>{sale.sold_by} <span className="ml-1">🛒</span></span>
                                        </div>
                                        <div className="text-sm"><span>סכום כולל: </span><span className="text-green-700">₪{parseFloat(sale.total_amount).toFixed(2)}  💵</span></div>
                                        <div className="text-sm"><span>לאחר הנחה: </span><span className="text-blue-700">₪{sale.items.reduce((sum, item) => sum + (Number(item.final_profit || item.total_profit) || 0), 0).toFixed(2)} 💵</span></div>
                                        <div className="text-sm"><span>משלוח: </span><span className="text-orange-700">₪{parseFloat(sale.delivery_cost || 0).toFixed(2)} 🚚</span></div>
                                        <div className="text-sm"><span>רווח כולל: </span><span className="text-purple-700">₪{Number(sale.total_profit || 0).toFixed(2)} 📈</span></div>
                                    </div>
                                    {/* טבלת פריטים */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border text-sm">
                                            <thead className="bg-blue-50">
                                                <tr>
                                                    <th className="p-2 border">שם מוצר</th>
                                                    <th className="p-2 border">כמות</th>
                                                    <th className="p-2 border">מחיר ליחידה</th>
                                                    <th className="p-2 border">עלות מוצר</th>
                                                    <th className="p-2 border">רווח פריט</th>
                                                    <th className="p-2 border">רווח כולל</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sale.items.map((item, i) => {
                                                    const profitPerItem = (Number(item.price_per_unit) || 0) - (Number(item.cost_price) || 0);
                                                    return (
                                                        <tr key={i} className="border-t">
                                                            <td className="p-1 border">{item.product_name}</td>
                                                            <td className="p-1 border">{item.quantity}</td>
                                                            <td className="p-1 border">₪{parseFloat(item.price_per_unit).toFixed(2)}</td>
                                                            <td className="p-1 border">₪{item.cost_price ? parseFloat(item.cost_price).toFixed(2) : '0.00'}</td>
                                                            <td className="p-1 border">₪{profitPerItem.toFixed(2)}</td>
                                                            <td className="p-1 border">₪{(profitPerItem * Number(item.quantity || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sortedGroupedArray.map((sale, idx) => (
                                <div key={sale.sale_id} className="border rounded-lg shadow-sm bg-white">
                                    {/* כותרת עסקה */}
                                    <div className="mb-3 space-y-1 text-right rtl">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold text-lg rtl">
                                            <a href={`#sale-${sale.sale_id}`} className="text-blue-600 underline">הזמנה #{sale.sale_id}</a>
                                            <span className="text-gray-500 text-base font-normal">{new Date(sale.sale_date).toLocaleDateString('he-IL')} <span className="ml-1">📅</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm rtl">
                                            <span>{sale.customer_name} <span className="ml-1">👤</span></span>
                                            <span className="mx-2">|</span>
                                            <span>{sale.sold_by} <span className="ml-1">🛒</span></span>
                                        </div>
                                        <div className="text-sm"><span>סכום כולל: </span><span className="text-green-700">₪{parseFloat(sale.total_amount).toFixed(2)} 💵</span></div>
                                        <div className="text-sm"><span>לאחר הנחה: </span><span className="text-blue-700">₪{sale.items.reduce((sum, item) => sum + (Number(item.final_profit || item.total_profit) || 0), 0).toFixed(2)} 💵</span></div>
                                        <div className="text-sm"><span>משלוח: </span><span className="text-orange-700">₪{parseFloat(sale.delivery_cost || 0).toFixed(2)} 🚚</span></div>
                                        <div className="text-sm"><span>רווח כולל: </span><span className="text-purple-700">₪{Number(sale.total_profit || 0).toFixed(2)} 📈</span></div>
                                    </div>
                                    {/* טבלת פריטים */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border text-sm">
                                            <thead className="bg-blue-50">
                                                <tr>
                                                    <th className="p-2 border">שם מוצר</th>
                                                    <th className="p-2 border">כמות</th>
                                                    <th className="p-2 border">מחיר ליחידה</th>
                                                    <th className="p-2 border">עלות מוצר</th>
                                                    <th className="p-2 border">רווח פריט</th>
                                                    <th className="p-2 border">רווח כולל</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sale.items.map((item, i) => {
                                                    const profitPerItem = (Number(item.price_per_unit) || 0) - (Number(item.cost_price) || 0);
                                                    return (
                                                        <tr key={i} className="border-t">
                                                            <td className="p-1 border">{item.product_name}</td>
                                                            <td className="p-1 border">{item.quantity}</td>
                                                            <td className="p-1 border">₪{parseFloat(item.price_per_unit).toFixed(2)}</td>
                                                            <td className="p-1 border">₪{item.cost_price ? parseFloat(item.cost_price).toFixed(2) : '0.00'}</td>
                                                            <td className="p-1 border">₪{profitPerItem.toFixed(2)}</td>
                                                            <td className="p-1 border">₪{(profitPerItem * Number(item.quantity || 0)).toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {viewMode === "mattressSummary" && mattressSummaryData && (
                    <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">📊 סיכום מזרנים לפי כמות</h2>
                        <table className="w-full border text-sm bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">סוג מזרן</th>
                                    <th className="p-2 border">סה"כ כמות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(mattressSummaryData).map(([name, qty], idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-2 border">{name}</td>
                                        <td className="p-2 border">{qty}</td>
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

export default SalesReportPage;
