import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../api/Api';

function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [navigate]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">Chào mừng Admin</h1>
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate('/staff')}
          className="bg-green-500 text-white text-lg font-semibold px-6 py-4 rounded-lg"
        >
          Bán hàng
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="bg-blue-500 text-white text-lg font-semibold px-6 py-4 rounded-lg"
        >
          Quản lí
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;