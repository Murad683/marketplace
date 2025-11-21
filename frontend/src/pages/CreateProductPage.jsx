import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getCategories,
  createCategory,
  createProduct,
  BASE_URL,
} from "../api";

export default function CreateProductPage() {
  const { auth, isMerchant } = useAuth();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    details: "",
    price: "",
    stockCount: "",
  });

  const [newCategoryName, setNewCategoryName] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadCategories = () => {
    getCategories().then(setCategories);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    if (!form.categoryId || !form.name || !form.details || !form.price || !form.stockCount) {
      alert("Please fill in all fields.");
      return;
    }
    if (!selectedFiles.length) {
      alert("Please select at least one product photo.");
      return;
    }

    try {
      setCreating(true);
      const fd = new FormData();
      fd.append("categoryId", Number(form.categoryId));
      fd.append("name", form.name);
      fd.append("details", form.details);
      fd.append("price", Number(form.price));
      fd.append("stockCount", Number(form.stockCount));
      selectedFiles.forEach((file) => fd.append("images", file));

      await createProduct(fd, auth);
      setSuccessMsg("Product created successfully.");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setForm({
        categoryId: "",
        name: "",
        details: "",
        price: "",
        stockCount: "",
      });
    } catch (err) {
      alert("Create product failed: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      await createCategory(newCategoryName.trim(), auth);
      setNewCategoryName("");
      loadCategories(); // siyahını yenilə
      alert("Category added.");
    } catch (err) {
      alert("Failed to create category: " + err.message);
    }
  };

  if (!isMerchant) {
    return (
      <div className="token-card max-w-md mx-auto mt-10 text-center p-8 section-meta">
        Only merchants can create products.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="token-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Create Product</h1>
            <p className="text-sm section-meta">
              Fill all fields and add photos, then submit once.
            </p>
          </div>
          {successMsg && (
            <div className="text-sm text-emerald-600 font-semibold">{successMsg}</div>
          )}
        </div>

        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1 section-meta">
                Category
              </label>
              <div className="flex gap-2">
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="field w-full text-sm"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className="field w-32 text-sm"
                  placeholder="New category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddCategory();
                  }}
                  className="btn btn-secondary text-sm whitespace-nowrap"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1 section-meta">
                Name
              </label>
              <input
                name="name"
                className="field w-full text-sm"
                onChange={handleChange}
                value={form.name}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1 section-meta">
              Details
            </label>
            <textarea
              name="details"
              className="field w-full text-sm h-24"
              onChange={handleChange}
              value={form.details}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1 section-meta">
                Price
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                className="field w-full text-sm"
                onChange={handleChange}
                value={form.price}
                required
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium block mb-1 section-meta">
                Stock Count
              </label>
              <input
                name="stockCount"
                type="number"
                className="field w-full text-sm"
                onChange={handleChange}
                value={form.stockCount}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2 section-meta">
              Upload product photos (required)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm section-meta"
              required
            />
            <p className="text-xs section-meta mt-2">
              Photos are uploaded together with the product in one request.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previewUrls.length > 0 ? (
              previewUrls.map((url, idx) => (
                <img
                  key={`local-${idx}`}
                  src={url}
                  alt="preview"
                  className="rounded-md border border-[var(--border-subtle)] h-24 w-full object-cover"
                />
              ))
            ) : (
              <div className="section-meta text-sm col-span-2 sm:col-span-3 text-center border border-dashed border-[var(--border-subtle)] rounded-md py-6">
                Select images to see preview here
              </div>
            )}
          </div>

          <button
            className="btn btn-primary w-full text-sm"
            type="submit"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
