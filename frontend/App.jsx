import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const emptyFood = {
  foodId: "",
  name: "",
  category: "",
  cuisine: "",
  ingredients: "",
  price: "",
  quantity: "",
  description: "",
  imageUrl: "",
};

function App() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyFood);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadFoods(keyword = search) {
    setLoading(true);
    try {
      const query = keyword.trim()
        ? `?search=${encodeURIComponent(keyword.trim())}`
        : "";

      const response = await fetch(`${API_URL}/api/foods${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không tải được danh sách món ăn");
      }

      setFoods(data);
    } catch (error) {
      setMessage(`Lỗi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods("");
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      ingredients: form.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      const url = editingId
        ? `${API_URL}/api/foods/${editingId}`
        : `${API_URL}/api/foods`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lưu món ăn");
      }

      setMessage(editingId ? "Cập nhật món ăn thành công!" : "Thêm món ăn thành công!");
      setForm(emptyFood);
      setEditingId(null);
      await loadFoods("");
      setSearch("");
    } catch (error) {
      setMessage(`Lỗi: ${error.message}`);
    }
  }

  function handleEdit(food) {
    setEditingId(food._id);
    setForm({
      foodId: food.foodId || "",
      name: food.name || "",
      category: food.category || "",
      cuisine: food.cuisine || "",
      ingredients: (food.ingredients || []).join(", "),
      price: food.price ?? "",
      quantity: food.quantity ?? "",
      description: food.description || "",
      imageUrl: food.imageUrl || "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa món "${food.name}" không?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/foods/${food._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa món ăn");
      }

      setMessage("Xóa món ăn thành công!");
      await loadFoods();
    } catch (error) {
      setMessage(`Lỗi: ${error.message}`);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyFood);
    setMessage("");
  }

  function handleSearch(event) {
    event.preventDefault();
    loadFoods(search);
  }

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <p className="eyebrow">FOOD MANAGEMENT SYSTEM</p>
          <h1>Quản lý món ăn</h1>
          <p className="subtitle">
            Quản lý danh sách món ăn, giá bán và số lượng trong kho.
          </p>
        </div>
        <div className="food-icon">🍜</div>
      </header>

      {message && (
        <div className="message" role="status">
          {message}
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      <section className="panel">
        <h2>{editingId ? "Cập nhật món ăn" : "Thêm món ăn mới"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Mã món ăn *
              <input
                name="foodId"
                value={form.foodId}
                onChange={handleChange}
                placeholder="VD: FOOD004"
                required
                disabled={Boolean(editingId)}
              />
            </label>

            <label>
              Tên món ăn *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nhập tên món ăn"
                required
              />
            </label>

            <label>
              Danh mục *
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="VD: Món nước"
                required
              />
            </label>

            <label>
              Ẩm thực *
              <input
                name="cuisine"
                value={form.cuisine}
                onChange={handleChange}
                placeholder="VD: Việt Nam"
                required
              />
            </label>

            <label>
              Giá bán (VNĐ) *
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                required
              />
            </label>

            <label>
              Số lượng *
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                required
              />
            </label>

            <label className="full-width">
              Nguyên liệu (ngăn cách bằng dấu phẩy)
              <input
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                placeholder="VD: Bánh phở, Thịt bò, Hành"
              />
            </label>

            <label className="full-width">
              Đường dẫn hình ảnh
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>

            <label className="full-width">
              Mô tả
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Mô tả món ăn..."
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit">
              {editingId ? "Lưu cập nhật" : "Thêm món ăn"}
            </button>

            {editingId && (
              <button
                className="button secondary"
                type="button"
                onClick={cancelEdit}
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="list-heading">
          <div>
            <h2>Danh sách món ăn</h2>
            <p className="subtitle">Tổng số: {foods.length} món</p>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, mã, danh mục..."
              aria-label="Tìm kiếm món ăn"
            />
            <button className="button primary" type="submit">
              Tìm kiếm
            </button>
          </form>
        </div>

        {loading ? (
          <p className="empty-state">Đang tải dữ liệu...</p>
        ) : foods.length === 0 ? (
          <p className="empty-state">
            Chưa có món ăn hoặc không tìm thấy kết quả.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã món</th>
                  <th>Tên món</th>
                  <th>Danh mục</th>
                  <th>Ẩm thực</th>
                  <th>Giá bán</th>
                  <th>Số lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food._id}>
                    <td>{food.foodId}</td>
                    <td>
                      <strong>{food.name}</strong>
                    </td>
                    <td>{food.category}</td>
                    <td>{food.cuisine}</td>
                    <td>{Number(food.price).toLocaleString("vi-VN")} đ</td>
                    <td>{food.quantity}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="button small edit"
                          type="button"
                          onClick={() => handleEdit(food)}
                        >
                          Sửa
                        </button>
                        <button
                          className="button small danger"
                          type="button"
                          onClick={() => handleDelete(food)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="page-footer">
        Hệ thống quản lý món ăn · MSSV 236481 · Nguyen Nhut Khang
      </footer>
    </main>
  );
}

export default App;
