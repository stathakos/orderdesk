import { useEffect, useState } from "react";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getIngredients, createIngredient, updateIngredient, deleteIngredient,
} from "../services/api";

// ------------------------------------
// Initial form states
// ------------------------------------
const EMPTY_CATEGORY = { name: "", customizations: [], sizes:[] };
const EMPTY_PRODUCT = { name: "", price: "", category_id: "", description: "", is_available: true };
const EMPTY_INGREDIENT = { name: "", price: "", is_available: true };
export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // category id for product filter

  // Category form
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCustomization, setNewCustomization] = useState({ name: "", price: "", type: "multi" });
  const [newSize, setNewSize] = useState({ name: "", price_change: "", base_price: "" });

  // Product form
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);

  // Ingredient form
  const [ingredientForm, setIngredientForm] = useState(EMPTY_INGREDIENT);
  const [editingIngredientId, setEditingIngredientId] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("categories"); // "categories" | "products"
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // mobile: toggle form visibility

  // ------------------------------------
  // Load data
  // ------------------------------------

  async function loadAll() {
    setLoading(true);
    try {
      const [cats, prods, ings] = await Promise.all([getCategories(), getProducts(), getIngredients()]);
      setCategories(cats);
      setProducts(prods);
      setIngredients(ings);
    } catch {
      alert("Failed to load menu data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // ------------------------------------
  // Category handlers
  // ------------------------------------

  function startEditCategory(cat) {
    setEditingCategoryId(cat.id);
    setCategoryForm({ 
      name: cat.name,
      customizations: cat.customizations || [],
      sizes: cat.sizes || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
    setNewCustomization({ name: "", price: "", type: "multi" });
    setNewSize({ name: "", price_change: "", base_price: "" });
    setShowForm(false);
  }

  function addCustomizationToForm() {
    if (!newCustomization.name.trim()) return;
    setCategoryForm((prev) => ({
      ...prev,
      customizations: [
        ...prev.customizations,
        { name: newCustomization.name.trim(), price: parseFloat(newCustomization.price) || 0, type: newCustomization.type || "multi"},
      ],
    }));
    setNewCustomization({ name: "", price: "", type: "multi" });
  }

  function addSizeToForm() {
    if (!newSize.name.trim()) return;
    setCategoryForm((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        { 
          name: newSize.name.trim(), 
          price_change: parseFloat(newSize.price_change) || 0,
          base_price: parseFloat(newSize.base_price) || 0, 
        },
      ],
    }));
    setNewSize({ name: "", price_change: "", base_price: "" });
  }

  function removeCustomizationFromForm(index) {
    setCategoryForm((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index),
    }));
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        const updated = await updateCategory(editingCategoryId, categoryForm);
        setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? updated : c)));
      } else {
        const created = await createCategory(categoryForm);
        setCategories((prev) => [...prev, created]);
      }
      cancelCategoryEdit();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save category.");
    }
  }

  async function handleDeleteCategory(catId) {
    if (!window.confirm("Delete this category and all its products?")) return;
    try {
      await deleteCategory(catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setProducts((prev) => prev.filter((p) => p.category_id !== catId));
      if (selectedCategory === catId) setSelectedCategory(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete category.");
    }
  }

  // ------------------------------------
  // Product handlers
  // ------------------------------------

  function startEditProduct(prod) {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      price: prod.price,
      category_id: prod.category_id,
      description: prod.description || "",
      is_available: prod.is_available,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

  }

  function cancelProductEdit() {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setShowForm(false);
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    const payload = {
      ...productForm,
      price: parseFloat(productForm.price),
      category_id: parseInt(productForm.category_id),
    };
    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingProductId ? updated : p)));
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [...prev, created]);
      }
      cancelProductEdit();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save product.");
    }
  }

  async function handleDeleteProduct(prodId) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(prodId);
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete product.");
    }
  }

  async function handleToggleAvailable(prod) {
    try {
      const updated = await updateProduct(prod.id, { is_available: !prod.is_available });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
    } catch {
      alert("Failed to update product availability.");
    }
  }

  // ------------------------------------
  // Ingredient handlers
  // ------------------------------------
  function startEditIngredient(ing) {
    setEditingIngredientId(ing.id);
    setIngredientForm({
      name: ing.name,
      price: ing.price,
      is_available: ing.is_available,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelIngredientEdit() {
    setEditingIngredientId(null);
    setIngredientForm(EMPTY_INGREDIENT);
    setShowForm(false);
  }

  async function handleIngredientSubmit(e) {
    e.preventDefault();
    const payload = {
      ...ingredientForm,
      price: parseFloat(ingredientForm.price) || 0,
    };
    try {
      if (editingIngredientId) {
        const updated = await updateIngredient(editingIngredientId, payload);
        setIngredients((prev) => prev.map((i) => (i.id === editingIngredientId ? updated : i)));
      } else {
        const created = await createIngredient(payload);
        setIngredients((prev) => [...prev, created]);
      }
      cancelIngredientEdit();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save ingredient.");
    }
  }

  async function handleDeleteIngredient(ingId) {
    if (!window.confirm("Delete this ingredient?")) return;
    try {
      await deleteIngredient(ingId);
      setIngredients((prev) => prev.filter((i) => i.id !== ingId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete ingredient.");
    }
  }

  async function handleToggleIngredientAvailable(ing) {
    try {
      const updated = await updateIngredient(ing.id, { is_available: !ing.is_available });
      setIngredients((prev) => prev.map((i) => (i.id === ing.id ? updated : i)));
    } catch {
      alert("Failed to update ingredient availability.");
    }
  }

  // ------------------------------------
  // Derived
  // ------------------------------------

  const visibleProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) return <div className="container mt-4">Loading menu...</div>;
  // ------------------------------------
  // Shared form components
  // ------------------------------------

  const CategoryForm = (
    <div className="card p-3 mb-3">
      <h6 className="mb-3">{editingCategoryId ? "Edit Category" : "New Category"}</h6>
      <form onSubmit={handleCategorySubmit}>
        <div className="mb-2">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={categoryForm.name}
            onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        {/* Customizations */}
        <label className="form-label small fw-semibold">Customizations</label>
        <small className="text-muted d-block mb-2">
          Use <strong>Single</strong> for required choices (e.g. pasta type — pick one). 
          Use <strong>Multi</strong> for optional extras (e.g. +Cheese, +Bacon).
        </small>
        {categoryForm.customizations.map((c, i) => (
          <div key={i} className="d-flex align-items-center gap-2 mb-1">
            <span className={`badge ${c.type === "single" ? "bg-warning text-dark" : "bg-secondary"}`}>
              {c.type === "single" ? "⦿ single" : "☑ multi"}
            </span>
            <span className="badge bg-secondary">{c.name}</span>
            <span className="text-muted small">+{c.price.toFixed(2)}€</span>
            <button type="button" className="btn btn-sm btn-outline-danger ms-auto"
              onClick={() => removeCustomizationFromForm(i)}>✕</button>
          </div>
        ))}
        <div className="d-flex gap-1 mt-1 mb-2">
          <input className="form-control form-control-sm" placeholder="e.g. Penne, + onion ..."
            value={newCustomization.name}
            onChange={(e) => setNewCustomization((p) => ({ ...p, name: e.target.value }))} />
          <input className="form-control form-control-sm" placeholder="€" type="number"
            step="0.10" min="0" value={newCustomization.price}
            onChange={(e) => setNewCustomization((p) => ({ ...p, price: e.target.value }))} />
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: "100px" }}
            value={newCustomization.type}
            onChange={(e) => setNewCustomization((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="multi">Multi</option>
            <option value="single">Single</option>
          </select>
          <button type="button" className="btn btn-sm btn-outline-primary text-nowrap"
            onClick={addCustomizationToForm}>Add</button>
        </div>
        {/* Sizes */}
        <label className="form-label small fw-semibold">Sizes <span className="text-muted fw-normal">(optional)</span></label>
        <small className="text-muted d-block mb-2">Price change relative to the product's base price. Use negative for smaller sizes.</small>
        {categoryForm.sizes.map((s, i) => (
          <div key={i} className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary">{s.name}</span>
            <span className="text-muted small">{s.price_change >= 0 ? `+${s.price_change.toFixed(2)}` : s.price_change.toFixed(2)}€</span>
            <span className="text-muted small">custom base: {(s.base_price || 0).toFixed(2)}€</span>
            <button type="button" className="btn btn-sm btn-outline-danger ms-auto"
              onClick={() => setCategoryForm((p) => ({
                ...p,
                sizes: p.sizes.filter((_, si) => si !== i)
              }))}>✕</button>
          </div>
        ))}
        <div className="d-flex gap-1 mt-1 mb-3">
          <input className="form-control form-control-sm" placeholder="e.g. Atomic (6 pcs)"
            value={newSize.name}
            onChange={(e) => setNewSize((p) => ({ ...p, name: e.target.value }))} />
          <input className="form-control form-control-sm" placeholder="+/- €" type="number"
            step="0.50" value={newSize.price_change}
            onChange={(e) => setNewSize((p) => ({ ...p, price_change: e.target.value }))} />
          <input className="form-control form-control-sm" placeholder="Custom base €" type="number"
            step="0.50" min="0" value={newSize.base_price}
            onChange={(e) => setNewSize((p) => ({ ...p, base_price: e.target.value }))} />
          <button type="button" className="btn btn-sm btn-outline-primary text-nowrap"
            onClick={addSizeToForm}>Add</button>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            {editingCategoryId ? "Save" : "Create"}
          </button>
          {editingCategoryId && (
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={cancelCategoryEdit}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );

  const ProductForm = (
    <div className="card p-3 mb-3">
      <h6 className="mb-3">{editingProductId ? "Edit Product" : "New Product"}</h6>
      <form onSubmit={handleProductSubmit}>
        <div className="mb-2">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={productForm.name}
            onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label small">Price (€)</label>
            <input className="form-control form-control-sm" type="number" step="0.10" min="0"
              value={productForm.price}
              onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} required />
          </div>
          <div className="col-6">
            <label className="form-label small">Category</label>
            <select className="form-select form-select-sm" value={productForm.category_id}
              onChange={(e) => setProductForm((p) => ({ ...p, category_id: e.target.value }))} required>
              <option value="">Select...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label small">Description <span className="text-muted">(optional)</span></label>
          <input className="form-control form-control-sm" value={productForm.description}
            onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="mb-3 form-check">
          <input className="form-check-input" type="checkbox" id="isAvailable"
            checked={productForm.is_available}
            onChange={(e) => setProductForm((p) => ({ ...p, is_available: e.target.checked }))} />
          <label className="form-check-label small" htmlFor="isAvailable">Available</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            {editingProductId ? "Save" : "Create"}
          </button>
          {editingProductId && (
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={cancelProductEdit}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );

  const IngredientForm = (
    <div className="card p-3 mb-3">
      <h6 className="mb-3">{editingIngredientId ? "Edit Ingredient" : "New Ingredient"}</h6>
      <form onSubmit={handleIngredientSubmit}>
        <div className="mb-2">
          <label className="form-label small">Name</label>
          <input className="form-control form-control-sm" value={ingredientForm.name}
            onChange={(e) => setIngredientForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Mushrooms" required />
        </div>
        <div className="mb-2">
          <label className="form-label small">Extra Price (€) <span className="text-muted">(0 if included)</span></label>
          <input className="form-control form-control-sm" type="number" step="0.10" min="0"
            value={ingredientForm.price}
            onChange={(e) => setIngredientForm((p) => ({ ...p, price: e.target.value }))} />
        </div>
        <div className="mb-3 form-check">
          <input className="form-check-input" type="checkbox" id="ingAvailable"
            checked={ingredientForm.is_available}
            onChange={(e) => setIngredientForm((p) => ({ ...p, is_available: e.target.checked }))} />
          <label className="form-check-label small" htmlFor="ingAvailable">Available</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            {editingIngredientId ? "Save" : "Create"}
          </button>
          {editingIngredientId && (
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={cancelIngredientEdit}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );

  // ------------------------------------
  // Render
  // ------------------------------------

  return (
     <div className="container-fluid px-3 px-md-4 mt-3">
      <h4 className="mb-3">Menu Manager</h4>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => { setActiveTab("categories"); cancelCategoryEdit(); cancelProductEdit(); }}>
            Categories
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "products" ? "active" : ""}`}
            onClick={() => { setActiveTab("products"); cancelCategoryEdit(); cancelProductEdit(); }}>
            Products
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "ingredients" ? "active" : ""}`}
            onClick={() => { setActiveTab("ingredients"); cancelCategoryEdit(); cancelProductEdit(); }}>
            🍕 Ingredients
          </button>
        </li>
      </ul>

      {/* ===================== CATEGORIES ===================== */}
      {activeTab === "categories" && (
        <>
          {/* Mobile: toggle form button */}
          <div className="d-md-none mb-2">
            <button className="btn btn-sm btn-outline-primary"
              onClick={() => setShowForm((p) => !p)}>
              {showForm ? "Hide Form" : "+ New Category"}
            </button>
          </div>

          {/* Form: always visible on md+, toggled on mobile */}
          <div className={`${showForm ? "d-block" : "d-none"} d-md-block`}>
            {/* Desktop: side by side */}
            <div className="d-none d-md-flex gap-4">
              <div style={{ minWidth: 340 }}>{CategoryForm}</div>
              <div className="flex-grow-1">
                <CategoryTable
                  categories={categories} products={products}
                  onEdit={startEditCategory} onDelete={handleDeleteCategory}
                />
              </div>
            </div>
          </div>

          {/* Mobile: form on top, list below */}
          <div className="d-md-none">
            {showForm && CategoryForm}
            <CategoryTable
              categories={categories} products={products}
              onEdit={startEditCategory} onDelete={handleDeleteCategory}
              mobile
            />
          </div>
        </>
      )}

      {/* ===================== PRODUCTS ===================== */}
      {activeTab === "products" && (
        <>
          {/* Mobile: toggle form */}
          <div className="d-md-none mb-2">
            <button className="btn btn-sm btn-outline-primary"
              onClick={() => setShowForm((p) => !p)}>
              {showForm ? "Hide Form" : "+ New Product"}
            </button>
          </div>

          {/* Category filter pills */}
          <div className="d-flex justify-content-center flex-wrap gap-1 mb-3">
            <button className={`btn btn-sm ${selectedCategory === null ? "btn-dark" : "btn-outline-secondary"}`}
              onClick={() => setSelectedCategory(null)}>All</button>
            {categories.map((cat) => (
              <button key={cat.id}
                className={`btn btn-sm ${selectedCategory === cat.id ? "btn-dark" : "btn-outline-secondary"}`}
                onClick={() => setSelectedCategory(cat.id)}>{cat.name}</button>
            ))}
          </div>

          {/* Desktop: side by side */}
          <div className="d-none d-md-flex gap-4">
            <div style={{ minWidth: 320 }}>{ProductForm}</div>
            <div className="flex-grow-1">
              <ProductTable
                products={visibleProducts} categories={categories}
                onEdit={startEditProduct} onDelete={handleDeleteProduct}
                onToggle={handleToggleAvailable}
              />
            </div>
          </div>

          {/* Mobile: stacked */}
          <div className="d-md-none">
            {showForm && ProductForm}
            <ProductTable
              products={visibleProducts} categories={categories}
              onEdit={startEditProduct} onDelete={handleDeleteProduct}
              onToggle={handleToggleAvailable}
              mobile
            />
          </div>
        </>
      )}

      {/* ===================== INGREDIENTS ===================== */}
      {activeTab === "ingredients" && (
        <>
          <div className="d-md-none mb-2">
            <button className="btn btn-sm btn-outline-primary"
              onClick={() => setShowForm((p) => !p)}>
              {showForm ? "Hide Form" : "+ New Ingredient"}
            </button>
          </div>
          <div className="d-none d-md-flex gap-4">
            <div style={{ minWidth: 320 }}>{IngredientForm}</div>
            <div className="flex-grow-1">
              <IngredientTable ingredients={ingredients}
                onEdit={startEditIngredient}
                onDelete={handleDeleteIngredient}
                onToggle={handleToggleIngredientAvailable} />
            </div>
          </div>
          <div className="d-md-none">
            {showForm && IngredientForm}
            <IngredientTable ingredients={ingredients}
              onEdit={startEditIngredient}
              onDelete={handleDeleteIngredient}
              onToggle={handleToggleIngredientAvailable}
              mobile />
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------
// Sub-components
// ------------------------------------

function CategoryTable({ categories, products, onEdit, onDelete, mobile }) {
  if (mobile) {
    return (
      <div>
        {categories.map((cat) => (
          <div key={cat.id} className="card mb-2 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{cat.name}</strong>
                <div className="small text-muted">
                  {products.filter((p) => p.category_id === cat.id).length} products
                </div>
                {cat.customizations?.length > 0 && (
                  <div className="small text-muted">
                    {cat.customizations.map((c) => c.name).join(", ")}
                  </div>
                )}
              </div>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(cat)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(cat.id)}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr><th>Name</th><th>Customizations</th><th>Sizes</th><th>Products</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {categories.map((cat) => (
          <tr key={cat.id}>
            <td>{cat.name}</td>
            <td><small className="text-muted">
              {cat.customizations?.length > 0 ? cat.customizations.map((c) => c.name).join(", ") : "—"}
            </small></td>
            <td><small className="text-muted">
              {cat.sizes?.length > 0 ? cat.sizes.map((s) => `${s.name}: ${s.price_change >= 0 ? "+" : ""}${(s.price_change ?? 0).toFixed(2)}€`).join(", ") : "—"}
            </small></td>
            <td>{products.filter((p) => p.category_id === cat.id).length}</td>
            <td>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(cat)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(cat.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProductTable({ products, categories, onEdit, onDelete, onToggle, mobile }) {
  if (mobile) {
    return (
      <div>
        {products.map((prod) => (
          <div key={prod.id} className="card mb-2 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{prod.name}</strong>
                <div className="small text-muted">
                  {categories.find((c) => c.id === prod.category_id)?.name ?? "—"} · {prod.price.toFixed(2)} €
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-1">
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox"
                    checked={prod.is_available} onChange={() => onToggle(prod)} />
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(prod)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(prod.id)}>Del</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {products.map((prod) => (
          <tr key={prod.id}>
            <td>{prod.name}</td>
            <td><small className="text-muted">{categories.find((c) => c.id === prod.category_id)?.name ?? "—"}</small></td>
            <td>{prod.price.toFixed(2)} €</td>
            <td>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox"
                  checked={prod.is_available} onChange={() => onToggle(prod)} />
              </div>
            </td>
            <td>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(prod)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(prod.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IngredientTable({ ingredients, onEdit, onDelete, onToggle, mobile }) {
  if (mobile) {
    return (
      <div>
        {ingredients.length === 0 && (
          <p className="text-muted text-center">No ingredients yet.</p>
        )}
        {ingredients.map((ing) => (
          <div key={ing.id} className={`card mb-2 p-3 ${!ing.is_available ? "opacity-50" : ""}`}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{ing.name}</strong>
                <div className="small text-muted">
                  {ing.price > 0 ? `+${ing.price.toFixed(2)} €` : "Included"}
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-1">
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox"
                    checked={ing.is_available} onChange={() => onToggle(ing)} />
                </div>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(ing)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(ing.id)}>Del</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="table table-hover align-middle">
      <thead className="table-light">
        <tr><th>Name</th><th>Extra Price</th><th>Available</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {ingredients.length === 0 ? (
          <tr><td colSpan={4} className="text-center text-muted">No ingredients yet.</td></tr>
        ) : (
          ingredients.map((ing) => (
            <tr key={ing.id} className={!ing.is_available ? "opacity-50" : ""}>
              <td className="fw-semibold">{ing.name}</td>
              <td>{ing.price > 0 ? `+${ing.price.toFixed(2)} €` : <span className="text-muted">Included</span>}</td>
              <td>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox"
                    checked={ing.is_available} onChange={() => onToggle(ing)} />
                </div>
              </td>
              <td>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(ing)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(ing.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

