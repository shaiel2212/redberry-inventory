import DOMPurify from 'dompurify';
import React, { useEffect, useState } from 'react';
import userService from '../services/userService';
import MainLayout from '../components/layout/MainLayout';

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('שגיאה בטעינת המשתמשים');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      await userService.updateUserRole(id, newRole);
      fetchUsers();
    } catch (err) {
      setError('שגיאה בעדכון תפקיד');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('בטוח שברצונך למחוק את המשתמש?')) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch (err) {
        setError('שגיאה במחיקת המשתמש');
      }
    }
  };

  return (
    <MainLayout>
    <div>
      <h2>ניהול משתמשים</h2>
      {error && <p className="error-message">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>שם משתמש</th>
            <th>אימייל</th>
            <th>תפקיד</th>
            <th>נוצר בתאריך</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{DOMPurify.sanitize(user.username)}</td>
              <td>{DOMPurify.sanitize(user.email)}</td>
              <td>
                <select
                  value={DOMPurify.sanitize(user.role)}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="user">משתמש</option>
                  <option value="admin">אדמין</option>
                </select>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString('he-IL')}</td>
              <td>
                <button onClick={() => handleDelete(user.id)} style={{ backgroundColor: 'darkred', color: 'white' }}>
                  מחק
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </MainLayout>
  );
  
};

export default UsersAdminPage;
