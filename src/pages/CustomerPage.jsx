import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import BASE_URL from '../api/Api';


function CustomerPage() {
  const { tableId } = useParams();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    axios.get(`${BASE_URL}items`)
      .then(response => {
        setItems(response.data);
        const initialQuantities = response.data.reduce((acc, item) => ({
          ...acc,
          [item.id]: 0
        }), {});
        setQuantities(initialQuantities);
      })
      .catch(error => console.error('Error fetching items:', error));
  }, []);

  const increaseQuantity = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: prev[itemId] + 1
    }));
  };

  const decreaseQuantity = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : 0
    }));
  };

  const handlePlaceOrder = () => {
    const orders = Object.keys(quantities)
      .filter(itemId => quantities[itemId] > 0)
      .map(itemId => ({
        item_id: itemId,
        quantity: quantities[itemId]
      }));

    if (orders.length === 0) {
      toast.info('Vui lòng chọn ít nhất một món');
      return;
    }

    axios.post(`${BASE_URL}orders`, {
      table: tableId,
      items: orders
    })
      .then(() => {
        toast.success('Bạn đã gọi món thành công!');
        setQuantities(prev => {
          const reset = {};
          Object.keys(prev).forEach(key => reset[key] = 0);
          return reset;
        });
      })
      .catch(error => {
        console.error('Error placing order:', error);
        toast.error('Gọi món thất bại, vui lòng thử lại.');
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Coffee Shop Menu - Bàn {tableId}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col items-center p-2">
            <img
              src={item.img || 'https://via.placeholder.com/150'}
              alt={item.name}
              className="w-full h-32 object-cover rounded-md"
            />
            <h3 className="text-sm font-semibold mt-2 text-center text-gray-500">{item.name}</h3>
            <p className="text-gray-600 text-sm">{item.price} VNĐ</p>
            <p className="text-gray-500 text-xs">{item.category ? item.category.name : 'No Category'}</p>
            <div className="flex items-center mt-2">
              <button
                onClick={() => decreaseQuantity(item.id)}
                className="bg-gray-300 text-gray-800 px-2 py-1 rounded-l"
              >
                –
              </button>
              <span className="px-3 text-gray-500">{quantities[item.id] || 0}</span>
              <button
                onClick={() => increaseQuantity(item.id)}
                className="bg-blue-500 text-white px-2 py-1 rounded-r"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handlePlaceOrder}
          className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Gọi món
        </button>
        <ToastContainer autoClose={8000} />
      </div>
      <a href='https://vi.pngtree.com/freepng/sweet-strawberry-smoothie-with-a-burst-of-flavor-perfect-for-refreshing-drink-isolated-transparent-background_16247333.html'>Hình ảnh PNG từ vi.pngtree.com/</a>
    </div>
  );
}

export default CustomerPage;