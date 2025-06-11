import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ItemModal from '../components/ItemModal';
import CategoryModal from '../components/CategoryModal';
import DataTable from '../components/DataTable';
import BASE_URL from '../api/Api';


function AdminPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [itemPage, setItemPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const navigate = useNavigate();
  const itemsPerPage = 5;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get(`${BASE_URL}items`),
        axios.get(`${BASE_URL}categories`),
      ]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data.');
      localStorage.removeItem('token');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}logout`);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleItemSubmit = async (data, id) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    try {
      if (id) {
        await axios.put(`${BASE_URL}items/${id}`, data, config);
        alert('Item updated successfully!');
      } else {
        await axios.post(`${BASE_URL}items`, data, config);
        alert('Item added successfully!');
      }
      fetchData();
      setIsItemModalOpen(false);
      setEditItem(null);
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item.');
    }
  };

  const handleItemDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${BASE_URL}items/${id}`);
        alert('Item deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Failed to delete item.');
      }
    }
  };

  const handleCategorySubmit = async (data, id) => {
    try {
      if (id) {
        await axios.put(`${BASE_URL}categories/${id}`, data);
        alert('Category updated successfully!');
      } else {
        await axios.post(`${BASE_URL}categories`, data);
        alert('Category added successfully!');
      }
      fetchData();
      setIsCategoryModalOpen(false);
      setEditCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category.');
    }
  };

  const handleCategoryDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`${BASE_URL}categories/${id}`);
        alert('Category deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Error deleting category:', err);
        alert('Failed to delete category.');
      }
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (item.category && item.category.name.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const paginatedItems = filteredItems.slice(
    (itemPage - 1) * itemsPerPage,
    itemPage * itemsPerPage
  );

  const totalItemPages = Math.ceil(filteredItems.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center text-red-500">
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Navbar trái */}
      <div className="w-64 bg-white shadow-md flex flex-col p-4">
        <h1 className="text-xl font-bold mb-6 text-center">Admin Dashboard</h1>
        <nav className="flex flex-col gap-4 flex-1">
          <div>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${activeTab === 'items' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => { setActiveTab('items'); setItemPage(1); setItemSearch(''); }}
            >
              Quản lí menu
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg mt-2 ${activeTab === 'categories' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('categories')}
            >
              Quản lí danh mục
            </button>
          </div>
          {activeTab === 'items' && (
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search items..."
              className="px-4 py-2 border rounded-lg"
            />
          )}
          <button
            onClick={() => activeTab === 'items' ? setIsItemModalOpen(true) : setIsCategoryModalOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            {activeTab === 'items' ? 'Thêm món mới' : 'Thêm danh mục'}
          </button>
          <button
            onClick={handleLogout}
            className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Đăng xuất
          </button>
        </nav>
      </div>
      {/* Bảng phải */}
      <div className="flex-1 p-6 overflow-auto bg-white rounded-lg shadow-md w-full">
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}
        {activeTab === 'items' ? (
          <div>
            <p className="text-gray-600 mb-4">Tổng: {filteredItems.length} món</p>
            {paginatedItems.length === 0 ? (
              <p className="text-center text-gray-600">No items available.</p>
            ) : (
              <DataTable
                headers={['Hình ảnh', 'Tên', 'Danh mục', 'Giá', 'Hành động']}
                data={paginatedItems}
                renderRow={(item) => (
                  <tr className="text-gray-500" key={item.id}>
                    <td className="border p-2">
                      <img
                        src={item.img || 'https://via.placeholder.com/50'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.category ? item.category.name : 'No Category'}</td>
                    <td className="border p-2">{item.price} VNĐ</td>
                    <td className="border p-2">
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setIsItemModalOpen(true);
                        }}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleItemDelete(item.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )}
                pagination={{
                  currentPage: itemPage,
                  totalPages: totalItemPages
                }}
                onPageChange={(page) => setItemPage(Math.max(1, Math.min(page, totalItemPages)))}
              />
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">Tổng: {categories.length} danh mục</p>
            {categories.length === 0 ? (
              <p className="text-center text-gray-600">No categories available.</p>
            ) : (
              <DataTable
                headers={['Tên', 'Hành động']}
                data={categories}
                renderRow={(category) => (
                  <tr key={category.id}>
                    <td className="border p-2 text-gray-500">{category.name}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => {
                          setEditCategory(category);
                          setIsCategoryModalOpen(true);
                        }}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleCategoryDelete(category.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        )}
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditItem(null);
          }}
          item={editItem}
          categories={categories}
          onSubmit={handleItemSubmit}
        />
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditCategory(null);
          }}
          category={editCategory}
          onSubmit={handleCategorySubmit}
        />
      </div>
    </div>
  );
}

export default AdminPage;