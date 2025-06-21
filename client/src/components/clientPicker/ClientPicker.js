import { useEffect, useState } from 'react';
import clientService from '../../services/clientService';

const ClientPicker = ({ selectedClientId, onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const data = await clientService.getAllClients();
      setClients(data);
    };
    fetchClients();
  }, []);

  const handleSelect = (e) => {
    const id = parseInt(e.target.value);
    onSelectClient(id);
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
      <select className="w-full p-2 border rounded" value={selectedClientId || ''} onChange={handleSelect}>
        <option value="">בחר לקוח</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.full_name}
          </option>
        ))}
      </select>


    </div>
  );
};

export default ClientPicker;
