import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

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
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
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
        const totalDelivery = filteredData.reduce((sum, row) => sum + (Number(row.delivery_cost) || 0), 0);
        const totalProfit = filteredData.reduce((sum, row) => sum + (Number(row.final_profit || row.total_profit) || 0), 0);
        setSummary({
            totalDiscount: totalDiscount.toFixed(2),
            totalDelivery: totalDelivery.toFixed(2),
            totalProfit: totalProfit.toFixed(2),
        });
        setShowSummary(true);
    };

    const calculateMattressSummary = () => {
        const summary = {};
        filteredData.forEach(item => {
            const key = item.product_name || 'לא ידוע';
            summary[key] = (summary[key] || 0) + (Number(item.quantity) || 0);
        });
        setMattressSummaryData(summary);
        setViewMode("mattressSummary");
    };

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
                </div>

                {showSummary && summary &&(
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
                        <div className="space-y-4">
                            {filteredData.map((row, idx) => (
                                <div key={idx} className="border rounded shadow-sm p-4 bg-white text-sm">
                                    <div className="flex justify-between font-bold">
                                        <span>#{row.sale_id}</span>
                                        <span>{new Date(row.sale_date).toLocaleDateString('he-IL')}</span>
                                    </div>
                                    <p>👤 לקוח: {row.customer_name}</p>
                                    <p>🛒 נמכר ע"י: {row.sold_by}</p>
                                    <p>🛏️ מוצר: {row.product_name}</p>
                                    <p>🔢 כמות: {row.quantity}</p>
                                    <p>💵 מחיר ליחידה: ₪{parseFloat(row.price_per_unit).toFixed(2)}</p>
                                    <p>🧾 עלות ליחידה: ₪{parseFloat(row.cost_price).toFixed(2)}</p>
                                    <p>📦 סכום כולל: ₪{parseFloat(row.total_amount).toFixed(2)}</p>
                                    <p>💸 לאחר הנחה: ₪{parseFloat(row.final_amount).toFixed(2)}</p>
                                    <p>🚚 משלוח: ₪{parseFloat(row.delivery_cost).toFixed(2)}</p>
                                    <p>📈 רווח: ₪{parseFloat(row.final_profit || row.total_profit).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {["מספר הזמנה", "תאריך", "שם לקוח", "נמכר על ידי", "שם מוצר", "כמות", "מחיר ליחידה", "עלות מוצר", "סכום כולל", "סכום כולל לאחר הנחה", "עלות משלוח", "רווח בסך הכל "].map((field, index) => (
                                            <th key={index} className="p-2 border cursor-pointer" onClick={() => handleSort(field)}>
                                                {field} {sortField === field ? (sortDirection === 'asc' ? '⬆️' : '⬇️') : ''}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-1 border">{row.sale_id}</td>
                                            <td className="p-1 border">{new Date(row.sale_date).toLocaleDateString('he-IL')}</td>
                                            <td className="p-1 border">{row.customer_name}</td>
                                            <td className="p-1 border">{row.sold_by}</td>
                                            <td className="p-1 border">{row.product_name}</td>
                                            <td className="p-1 border">{row.quantity}</td>
                                            <td className="p-1 border">₪{parseFloat(row.price_per_unit).toFixed(2)}</td>
                                            <td className="p-1 border">₪{parseFloat(row.cost_price).toFixed(2)}</td>
                                            <td className="p-1 border">₪{parseFloat(row.total_amount).toFixed(2)}</td>
                                            <td className="p-1 border">₪{parseFloat(row.final_amount).toFixed(2)}</td>
                                            <td className="p-1 border">₪{parseFloat(row.delivery_cost).toFixed(2)}</td>
                                            <td className="p-1 border">₪{parseFloat(row.final_profit || row.total_profit).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
