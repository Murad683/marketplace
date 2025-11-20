import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getCategories,
  createCategory,
  createProduct,
  getProductById,
  uploadProductPhoto,
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

  const [createdProduct, setCreatedProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

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
    try {
      const p = await createProduct(
        {
          categoryId: Number(form.categoryId),
          name: form.name,
          details: form.details,
          price: Number(form.price),
          stockCount: Number(form.stockCount),
        },
        auth
      );
      setCreatedProduct(p);
      setPreviewProduct(p);
      alert("Product created! Now upload photos below.");
    } catch (err) {
      alert("Create product failed: " + err.message);
    }
  };

  const handleFileChange = async (e) => {
    if (!createdProduct) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // birdən çox şəkil upload edək (ardıcıl)
    for (const file of files) {
      try {
        await uploadProductPhoto(createdProduct.id, file, auth);
      } catch (err) {
        alert("Photo upload failed for one file: " + err.message);
      }
    }

    // şəkillər yenilənsin
    const refreshed = await getProductById(createdProduct.id);
    setPreviewProduct(refreshed);
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
    <div className="max-w-5xl mx-auto px-6 py-8 grid gap-6 lg:gap-8 lg:grid-cols-2">
      {/* LEFT: create product form + create category */}
      <div className="space-y-8">
        {/* product create card */}
        <div className="token-card p-6 space-y-4">
          <h1 className="text-xl font-semibold">
            Create Product
          </h1>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1 section-meta">
                Category
              </label>
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
            </div>

            <div>
              <label className="text-sm font-medium block mb-1 section-meta">
                Name
              </label>
              <input
                name="name"
                className="field w-full text-sm"
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1 section-meta">
                Details
              </label>
              <textarea
                name="details"
                className="field w-full text-sm h-24"
                onChange={handleChange}
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
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary w-full text-sm"
              type="submit"
            >
              Create
            </button>
          </form>
        </div>

        {/* category create card */}
        <div className="token-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">
            Add New Category
          </h2>
          <div className="flex gap-2">
            <input
              className="field flex-1 text-sm"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button
              onClick={handleAddCategory}
              className="btn btn-secondary text-sm whitespace-nowrap"
            >
              Add
            </button>
          </div>
          <p className="text-[11px] section-meta mt-1">
            This calls POST /categories and refreshes the dropdown above.
          </p>
        </div>
      </div>

      {/* RIGHT: photo upload + live preview */}
      <div className="token-card p-6 h-fit space-y-4">
        <h2 className="text-lg font-semibold">
          Photos & Preview
        </h2>

        {!createdProduct ? (
          <div className="text-sm section-meta bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-subtle)] rounded-md p-6 text-center">
            After you create the product, you can upload photos here.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2 section-meta">
                Upload product photos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm section-meta"
              />
              <p className="text-xs section-meta mt-1">
                You can select multiple files. Each one is sent to
                POST /products/{`{productId}`}/photos
              </p>
            </div>

            {previewProduct && (
              <div className="callout p-4 space-y-2">
                <div className="font-medium">
                  {previewProduct.name}
                </div>
                <div className="text-sm font-semibold">
                  ${previewProduct.price}
                </div>
                <div className="text-xs section-meta">
                  Stock: {previewProduct.stockCount}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {previewProduct.photoIds?.length ? (
                    previewProduct.photoIds.map((pid) => (
                      <img
                        key={pid}
                        src={`http://localhost:8080/products/${previewProduct.id}/photos/${pid}`}
                        alt={previewProduct.name}
                        className="rounded-md border border-[var(--border-subtle)] h-24 w-full object-cover"
                      />
                    ))
                  ) : (
                    <div className="section-meta text-sm col-span-2 text-center border border-dashed border-[var(--border-subtle)] rounded-md py-6">
                      No photos yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
