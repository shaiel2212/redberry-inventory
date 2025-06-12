
import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const DashboardPage = () => {
  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">לוח בקרה</h2>

        {/* כרטיסי מידע */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded shadow p-4 text-right">
            <p className="text-sm text-gray-500">סה"כ מכירות היום</p>
            <p className="text-2xl font-bold text-green-600">₪12,345</p>
          </div>
          <div className="bg-white border rounded shadow p-4 text-right">
            <p className="text-sm text-gray-500">מלאי נמוך</p>
            <p className="text-2xl font-bold text-red-500">3 מוצרים</p>
          </div>
        </div>

        {/* גרף */}
        <div className="bg-white border rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">גרף מכירות</h3>
          <div className="h-40 flex items-center justify-center text-gray-400">
            {/* Placeholder לגרף */}
            גרף בקרוב 📊
          </div>
        </div>

        {/* קיצורי דרך */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm font-semibold">
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded">ניהול מוצרים</button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 rounded">ביצוע מכירה</button>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded">צפייה במכירות</button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded">משתמשים</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
