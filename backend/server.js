const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const foodSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: [true, "Mã món ăn là bắt buộc"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Tên món ăn là bắt buộc"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Danh mục là bắt buộc"],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, "Ẩm thực là bắt buộc"],
      trim: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Giá là bắt buộc"],
      min: [0, "Giá không được âm"],
    },
    quantity: {
      type: Number,
      required: [true, "Số lượng là bắt buộc"],
      min: [0, "Số lượng không được âm"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Food = mongoose.model("Food", foodSchema);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Food Management API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/api/foods", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const keyword = search.trim();
      filter.$or = [
        { foodId: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } },
        { cuisine: { $regex: keyword, $options: "i" } },
      ];
    }

    const foods = await Food.find(filter).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách món ăn", error: error.message });
  }
});

app.get("/api/foods/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let food = null;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findById(id);
    }

    if (!food) {
      food = await Food.findOne({ foodId: id });
    }

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }

    res.json(food);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin món ăn", error: error.message });
  }
});

app.post("/api/foods", async (req, res) => {
  try {
    const { foodId, name, category, cuisine, price, quantity } = req.body;

    if (!foodId || !name || !category || !cuisine || price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: "Vui lòng nhập mã món, tên món, danh mục, ẩm thực, giá và số lượng",
      });
    }

    const food = await Food.create(req.body);
    res.status(201).json(food);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã món ăn đã tồn tại" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Lỗi thêm món ăn", error: error.message });
  }
});

app.put("/api/foods/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;

    let food = null;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
    }

    if (!food) {
      food = await Food.findOneAndUpdate({ foodId: id }, updates, {
        new: true,
        runValidators: true,
      });
    }

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn để cập nhật" });
    }

    res.json(food);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã món ăn đã tồn tại" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Lỗi cập nhật món ăn", error: error.message });
  }
});

app.delete("/api/foods/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let food = null;

    if (mongoose.isValidObjectId(id)) {
      food = await Food.findByIdAndDelete(id);
    }

    if (!food) {
      food = await Food.findOneAndDelete({ foodId: id });
    }

    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn để xóa" });
    }

    res.json({ message: "Xóa món ăn thành công", food });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa món ăn", error: error.message });
  }
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Chưa cấu hình biến môi trường MONGODB_URI");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "236481_NguyenNhutKhang",
    });

    console.log("Đã kết nối MongoDB Atlas");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server đang chạy tại cổng ${PORT}`);
    });
  } catch (error) {
    console.error("Không thể khởi động server:", error.message);
    process.exit(1);
  }
}

startServer();
