import { useEffect, useMemo, useState } from 'react';
import clientService from '../../services/clientService';

const ClientPicker = ({ selectedClientId, onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [newClientName, setNewClientName] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const data = await clientService.getAllClients();
      setClients(data);
    };
    fetchClients();
  }, []);

  // אם נבחר לקוח חיצונית, נראה את שמו בשדה
  useEffect(() => {
    if (!selectedClientId) return;
    const selected = clients.find(c => c.id === selectedClientId);
    if (selected) setSearch(selected.full_name || '');
  }, [selectedClientId, clients]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return clients; // דרוש לפחות 2 תווים לסינון
    return clients.filter(c => (c.full_name || '').toLowerCase().includes(term));
  }, [clients, search]);

  const handlePick = (client) => {
    onSelectClient(client.id);
    setSearch(client.full_name || '');
    setOpen(false);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;
    const newClient = await clientService.createClient({
      full_name: newClientName,
      base_discount_percent: 0,
      cash_discount_percent: 5,
    });
    setClients((prev) => [...prev, newClient]);
    onSelectClient(newClient.id);
    setNewClientName('');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="הקלד לפחות 2 תווים לחיפוש לקוח..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {search.trim().length >= 2 && open && (
          <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border rounded shadow text-right">
            {filteredClients.length === 0 && (
              <li className="px-3 py-2 text-gray-500">לא נמצאו לקוחות</li>
            )}
            {filteredClients.slice(0, 50).map(client => (
              <li
                key={client.id}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                onMouseDown={(e) => { e.preventDefault(); handlePick(client); }}
              >
                {client.full_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedClientId && (
        <div className="text-sm text-gray-600">נבחר: {clients.find(c => c.id === selectedClientId)?.full_name || selectedClientId}</div>
      )}


    </div>
  );
};

export default ClientPicker;
