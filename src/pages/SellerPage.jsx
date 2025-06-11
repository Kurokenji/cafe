import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from '../components/DataTable';
import BASE_URL from '../api/Api';

function SellerPage() {
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const ordersPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}orders`);
        setOrders(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        localStorage.removeItem('token');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    const pusher = new Pusher('08904c6010663c615448', {
      cluster: 'ap1',
      forceTLS: true,
    });
    const channel = pusher.subscribe('orders');
    channel.bind('App\\Events\\NewOrder', (data) => {
      setOrders(prev => [data.order, ...prev]);
      toast.info('Bạn có đơn hàng mới', {
        position: 'top-right',
        autoClose: 3000,
      });
      const audio = new Audio('/sounds/ting.mp3');
      audio.play().catch(err => console.error('Audio error:', err));
    });

    return () => pusher.unsubscribe('orders');
  }, [navigate]);

  const handleConfirmOrder = async (id) => {
    try {
      await axios.put(`${BASE_URL}orders/${id}/prepare`);
      const res = await axios.get(`${BASE_URL}orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
      toast.success('Order confirmed successfully!');
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm order.');
    }
  };

  const handleStartDelivery = async (id) => {
    try {
      await axios.put(`${BASE_URL}orders/${id}/deliver`);
      const res = await axios.get(`${BASE_URL}orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
      toast.success('Delivery started successfully!');
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to start delivery.');
    }
  };

  const handleCompleteDelivery = async (id) => {
    try {
      await axios.put(`${BASE_URL}orders/${id}/complete`);
      const res = await axios.get(`${BASE_URL}orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
      toast.success('Delivery completed successfully!');
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to complete delivery.');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await axios.put(`${BASE_URL}orders/${id}/pay`);
      const res = await axios.get(`${BASE_URL}orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
      toast.success('Order marked as paid!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as paid.');
    }
  };

  const handleCancelOrder = async (id) => {
    setOrderToCancel(orders.find(order => order.id === id));
    setIsConfirmModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      await axios.put(`${BASE_URL}orders/${orderToCancel.id}/cancel`);
      const res = await axios.get(`${BASE_URL}orders`);
      setOrders(Array.isArray(res.data) ? res.data : []);
      toast.success('Order cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsConfirmModalOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleLogout = async () => {
    if (toast.confirm('Bạn có muốn đăng xuất không')) {
      try {
        await axios.post(`${BASE_URL}logout`);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
        toast.success('Đăng xuất thành công!');
      } catch (err) {
        console.error('Logout error:', err);
        toast.error('Đăng xuất thất bại.');
      }
    }
  };

  // Lọc và sắp xếp đơn hàng
  const newOrders = orders
    .filter(order => ['pending', 'preparing', 'delivering'].includes(order.status))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const paymentOrders = orders
    .filter(order => ['delivered', 'paid'].includes(order.status))
    .sort((a, b) => {
      if (a.status === 'delivered' && b.status === 'delivered') {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (a.status === 'delivered') return -1;
      if (b.status === 'delivered') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const filteredOrders = (activeTab === 'new' ? newOrders : paymentOrders)
    .filter(order =>
      (order.table.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.status.toLowerCase().includes(orderSearch.toLowerCase())) &&
      (selectedStatus === 'all' || order.status === selectedStatus)
    );

  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage
  );

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
    <div className="flex h-screen bg-gray-100 w-screen">
      {/* Navbar trái */}
      <div className="w-64 bg-white shadow-md flex flex-col p-4">
        <h1 className="text-xl font-bold mb-6 text-center">Seller Dashboard</h1>
        <nav className="flex flex-col gap-4 flex-1">
          <div>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${activeTab === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => { setActiveTab('new'); setOrderPage(1); setSelectedStatus('all'); }}
            >
              Đơn mới
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg mt-2 ${activeTab === 'payment' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => { setActiveTab('payment'); setOrderPage(1); setSelectedStatus('all'); }}
            >
              Thanh toán
            </button>
          </div>
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Tìm kiếm đơn hàng..."
            className="px-4 py-2 border rounded-lg"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tất cả trạng thái</option>
            {activeTab === 'new' ? (
              <>
                <option value="pending">Chờ xác nhận</option>
                <option value="preparing">Đang chuẩn bị</option>
                <option value="delivering">Đang giao</option>
              </>
            ) : (
              <>
                <option value="delivered">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
              </>
            )}
          </select>
          <button
            onClick={handleLogout}
            className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Đăng xuất
          </button>
        </nav>
      </div>
      {/* Bảng phải */}
      <div className="flex-1 p-6 overflow-auto">
        <p className="text-gray-600 mb-4">Tổng: {filteredOrders.length} đơn hàng</p>
        {paginatedOrders.length === 0 ? (
          <p className="text-center text-gray-600">Không có đơn hàng nào.</p>
        ) : (
          <DataTable
            headers={['Bàn', 'Món', 'Tổng', 'Trạng thái', 'Hành động']}
            data={paginatedOrders}
            renderRow={(order) => (
              <tr className="text-gray-500" key={order.id}>
                <td className="border p-2">{order.table}</td>
                <td className="border p-2">
                  <ul>
                    {order.order_items && order.order_items.map(item => (
                      <li key={item.id}>
                        {item.item.name} x {item.quantity} - {item.item.price * item.quantity} VNĐ
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="border p-2">{order.total_price} VNĐ</td>
                <td className="border p-2">
                  {order.status === 'pending' && 'Chờ xác nhận'}
                  {order.status === 'preparing' && 'Đang chuẩn bị'}
                  {order.status === 'delivering' && 'Đang giao'}
                  {order.status === 'delivered' && 'Chờ thanh toán'}
                  {order.status === 'paid' && 'Đã thanh toán'}
                  {order.status === 'cancelled' && 'Đã hủy'}
                </td>
                <td className="border p-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Hủy
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStartDelivery(order.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Bắt đầu giao
                    </button>
                  )}
                  {order.status === 'delivering' && (
                    <button
                      onClick={() => handleCompleteDelivery(order.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Hoàn thành giao
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => handleMarkAsPaid(order.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Đánh dấu đã thanh toán
                    </button>
                  )}
                </td>
              </tr>
            )}
            pagination={{
              currentPage: orderPage,
              totalPages: totalOrderPages
            }}
            onPageChange={(page) => setOrderPage(Math.max(1, Math.min(page, totalOrderPages)))}
          />
        )}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-3">Xác nhận hủy đơn</h2>
              {orderToCancel && (
                <div className="text-sm text-gray-700 mb-4">
                  <p><strong>Bàn:</strong> {orderToCancel.table}</p>
                  <p><strong>Tổng tiền:</strong> {orderToCancel.total_price} VNĐ</p>
                  <p><strong>Món:</strong></p>
                  <ul className="list-disc pl-5">
                    {orderToCancel.order_items && orderToCancel.order_items.map(item => (
                      <li key={item.id}>{item.item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">Bạn có chắc muốn hủy đơn này?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmCancelOrder}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

export default SellerPage;