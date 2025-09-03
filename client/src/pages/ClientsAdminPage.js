import React, { useState, useEffect } from 'react';
import clientService from '../services/clientService';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import MainLayout from '../components/layout/MainLayout';

const emptyClient = {
  full_name: '',
  base_discount_percent: 0,
  cash_discount_percent: 0,
  phone: '',
  email: '',
  billing_day: '',
};

const ClientsAdminPage = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await clientService.getAllClients();
      setClients(data);
    } catch (err) {
      setError('שגיאה בטעינת הלקוחות');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditClient(null);
    setForm(emptyClient);
    setDialogOpen(true);
    setError('');
  };
  const openEdit = (client) => {
    setEditClient(client);
    setForm({ ...client });
    setDialogOpen(true);
    setError('');
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditClient(null);
    setForm(emptyClient);
    setError('');
  };
  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'billing_day') {
      // Coerce to number or empty
      const v = value === '' ? '' : String(Math.max(1, Math.min(31, parseInt(value, 10) || 0)));
      setForm(f => ({ ...f, [name]: v }));
      return;
    }
    if (name === 'base_discount_percent' || name === 'cash_discount_percent') {
      const num = Number.isFinite(Number(value)) ? Number(value) : 0;
      setForm(f => ({ ...f, [name]: num }));
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (!form.full_name) {
        setError('שם הלקוח הוא שדה חובה');
        setSaving(false);
        return;
      }
      const payload = {
        ...form,
        billing_day: form.billing_day === '' ? null : Number(form.billing_day)
      };
      if (editClient) {
        await clientService.updateClient(editClient.id, payload);
      } else {
        await clientService.createClient(payload);
      }
      await fetchClients();
      closeDialog();
    } catch (err) {
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-4 text-right">
        <h2 className="text-2xl font-bold mb-4">ניהול לקוחות</h2>
        <div className="mb-4 flex flex-col md:flex-row gap-2 md:gap-4 items-center">
          <input
            type="text"
            placeholder="חפש לפי שם, טלפון או אימייל..."
            className="border rounded p-2 w-full md:w-64 text-right"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {user?.role === 'admin' && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow"
              onClick={openAdd}
            >
              הוסף לקוח
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8 text-lg">טוען לקוחות...</div>
        ) : (
          <>
            {/* דסקטופ: טבלה */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">שם מלא</th>
                    <th className="p-2 border">טלפון</th>
                    <th className="p-2 border">אימייל</th>
                    <th className="p-2 border">הנחת בסיס (%)</th>
                    <th className="p-2 border">הנחת מזומן (%)</th>
                    <th className="p-2 border">יום חיוב</th>
                    {user?.role === 'admin' && <th className="p-2 border">עריכה</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center">לא נמצאו לקוחות.</td></tr>
                  )}
                  {filteredClients.map(client => (
                    <tr key={client.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 border">{client.full_name}</td>
                      <td className="p-2 border">{client.phone || '-'}</td>
                      <td className="p-2 border">{client.email || '-'}</td>
                      <td className="p-2 border">{client.base_discount_percent || 0}</td>
                      <td className="p-2 border">{client.cash_discount_percent || 0}</td>
                      <td className="p-2 border">{client.billing_day || '-'}</td>
                      {user?.role === 'admin' && (
                        <td className="p-2 border">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow"
                            onClick={() => openEdit(client)}
                          >
                            ערוך
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* מובייל: כרטיסים */}
            <div className="block md:hidden space-y-4">
              {filteredClients.length === 0 && (
                <div className="text-center py-8 text-lg">לא נמצאו לקוחות.</div>
              )}
              {filteredClients.map(client => (
                <div key={client.id} className="border rounded-xl p-4 shadow bg-white text-right">
                  <div className="font-bold text-lg mb-1">{client.full_name}</div>
                  <div><b>טלפון:</b> {client.phone || '-'}</div>
                  <div><b>אימייל:</b> {client.email || '-'}</div>
                  <div><b>הנחת בסיס:</b> {client.base_discount_percent || 0}%</div>
                  <div><b>הנחת מזומן:</b> {client.cash_discount_percent || 0}%</div>
                  <div><b>יום חיוב:</b> {client.billing_day || '-'}</div>
                  {user?.role === 'admin' && (
                    <button
                      className="mt-3 bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded shadow"
                      onClick={() => openEdit(client)}
                    >
                      ערוך
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {/* דיאלוג הוספה/עריכה */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl" className="text-right max-w-md w-full p-6 rounded-3xl shadow-2xl bg-white border border-blue-200">
            <DialogTitle asChild>
              <h3 className="text-lg font-bold mb-2">{editClient ? 'עריכת לקוח' : 'הוספת לקוח'}</h3>
            </DialogTitle>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <label className="block font-semibold">שם מלא*:</label>
            <input name="full_name" className="border rounded p-2 w-full mb-2 text-right" value={form.full_name} onChange={handleChange} required />
            <label className="block font-semibold">טלפון:</label>
            <input name="phone" className="border rounded p-2 w-full mb-2 text-right" value={form.phone} onChange={handleChange} />
            <label className="block font-semibold">אימייל:</label>
            <input name="email" className="border rounded p-2 w-full mb-2 text-right" value={form.email} onChange={handleChange} />
            <label className="block font-semibold">הנחת בסיס (%):</label>
            <input name="base_discount_percent" type="number" className="border rounded p-2 w-full mb-2 text-right" value={form.base_discount_percent} onChange={handleChange} />
            <label className="block font-semibold">הנחת מזומן (%):</label>
            <input name="cash_discount_percent" type="number" className="border rounded p-2 w-full mb-2 text-right" value={form.cash_discount_percent} onChange={handleChange} />
            <label className="block font-semibold">יום חיוב:</label>
            <input name="billing_day" type="number" className="border rounded p-2 w-full mb-4 text-right" value={form.billing_day} onChange={handleChange} />
            <div className="flex gap-2 justify-end mt-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold" onClick={handleSave} disabled={saving}>{editClient ? 'שמור שינויים' : 'הוסף לקוח'}</button>
              <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold" onClick={closeDialog} type="button">ביטול</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default ClientsAdminPage; 