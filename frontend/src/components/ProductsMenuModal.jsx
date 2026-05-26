import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getProducts, getCategories, getIngredients } from "../services/api";

export default function ProductsMenuModal({ onClose, onProductSelected }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarProduct, setSidebarProduct] = useState(null);
  const [checkedCustomizations, setCheckedCustomizations] = useState([]);
  const [showCustomPizza, setShowCustomPizza] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, ings] = await Promise.all([getCategories(), getProducts(), getIngredients()]);
        setCategories(cats);
        setProducts(prods);
        setIngredients(ings);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      } catch {
        alert("Could not load menu data");
      }
    }
    loadData();
  }, []);

  function openSidebar(prod) {
    setSidebarProduct(prod);
    setCheckedCustomizations([]);
    // Auto-select classic size if available
    if (prod.category?.sizes?.length > 0) {
      const defaultSize = prod.category.sizes[1] ?? prod.category.sizes[0];
      setSelectedSize(defaultSize);
    } else {
      setSelectedSize(null);
    }
  }

  function closeSidebar() {
    setSidebarProduct(null);
    setCheckedCustomizations([]);
    setSelectedSize(null);
  }

  function toggleCustomization(custName) {
    setCheckedCustomizations((prev) =>
      prev.includes(custName) ? prev.filter((c) => c !== custName) : [...prev, custName]
    );
  }

  function handleConfirm() {
    if (!sidebarProduct) return;
    // Block if sizes exist but none selected
    if (sidebarProduct.category?.sizes?.length > 0 && !selectedSize) return;

    const selectedCusts = (sidebarProduct.category?.customizations || []).filter((c) =>
      checkedCustomizations.includes(c.name)
    );
    const custsExtraPrice = selectedCusts.reduce((sum, c) => sum + (c.price || 0), 0);
    const sizeExtra = selectedSize?.price_change || 0;

    const customLabels = selectedCusts.map((c) =>
      c.price > 0 ? `${c.name} (+${c.price.toFixed(2)}€)` : c.name
    );

    const finalPrice = (selectedSize?.base_price > 0 
      ? selectedSize.base_price 
      : sidebarProduct.price + (selectedSize?.price_change || 0)) + custsExtraPrice;

    // Include size in product name if selected
    const productName = selectedSize
      ? `${sidebarProduct.name} (${selectedSize.name})`
      : sidebarProduct.name;

    onProductSelected(
      { 
        ...sidebarProduct,
        name: productName,
        product_name: productName,
        price: finalPrice,
      },
      customLabels
    );
    closeSidebar();
  }

  const visibleProducts = products
    .filter((p) => p.category_id === selectedCategory)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const sidebarCustomizations = sidebarProduct?.category?.customizations || [];

  const extraPrice = sidebarCustomizations
    .filter((c) => checkedCustomizations.includes(c.name))
    .reduce((sum, c) => sum + (c.price || 0), 0);

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10002,
      }} />

      {/* Modal container */}
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "fixed",
        top: "3vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(1100px, 96vw)",
        maxHeight: "94vh",
        backgroundColor: "var(--bs-body-bg)",
        borderRadius: "10px",
        zIndex: 10003,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Inner layout: row on md+, column on mobile ── */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          overflow: "hidden",
        }} className="flex-md-row flex-column">

          {/* LEFT / TOP: product grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Select Product</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>✕ Close</button>
            </div>

            {/* Search */}
            <input type="text" className="form-control form-control-sm mb-2"
              placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} />

            {/* Category tabs — scrollable on mobile */}
            <ul className="nav nav-tabs mb-2" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
              {categories.map((cat) => (
                <li className="nav-item" key={cat.id} style={{ whiteSpace: "nowrap" }}>
                  <button
                    className={`nav-link py-1 px-2 ${selectedCategory === cat.id ? "active" : ""}`}
                    style={{ fontSize: "0.85rem" }}
                    onClick={() => { setSelectedCategory(cat.id); closeSidebar(); }}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Product grid — 2 cols on mobile, 3 on desktop */}
            <div className="row g-2">
              {/* Special "Make Your Own Pizza" card — only in pizza category */}
              {categories.find((c) => c.id === selectedCategory)?.name?.toLowerCase().includes("pizza") && (
                <div className="col-6 col-md-4">
                  <div
                    className="card text-center h-100 border-danger"
                    onClick={() => { closeSidebar(); setShowCustomPizza(true); }}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "var(--bs-body-bg)", // #fff5f5
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center">
                      <div style={{ fontSize: "1.5rem" }}>🍕</div>
                      <h6 className="card-title mb-1 text-danger fw-bold" style={{ fontSize: "0.85rem" }}>
                        Make Your Own
                      </h6>
                      <p className="card-text text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                        Custom pizza
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {visibleProducts.map((prod) => {
                const isActive = sidebarProduct?.id === prod.id;
                const isUnavailable = !prod.is_available;
                return (
                  <div key={prod.id} className="col-6 col-md-4">
                    <div
                      className="card text-center h-100"
                      onClick={() => !isUnavailable && openSidebar(prod)}
                      style={{
                        cursor: isUnavailable ?  "not-allowed" : "pointer",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        transform: isActive ? "scale(1.03)" : "scale(1)",
                        boxShadow: isActive ? "0 0 0 2px #0d6efd" : "none",
                        backgroundColor: isUnavailable ? "var(--bs-secondary-bg)" : isActive ? "var(--bs-primary-bg-subtle)" : "var(--bs-body-bg)",
                        opacity: isUnavailable ? 0.6 : 1,
                      }}
                    >
                      <div className="card-body p-2">
                        <h6 className="card-title mb-1" style={{ fontSize: "0.85rem" }}>{prod.name}
                          {isUnavailable && (
                            <span className="badge bg-secondary ms-1" style={{ fontSize: "0.65rem" }}>
                              Unavailable
                            </span>
                          )}
                        </h6>
                        <p className="card-text text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                          {prod.price.toFixed(2)} €
                        </p>
                        {prod.category?.customizations?.length > 0 && (
                          <small className="text-primary" style={{ fontSize: "0.75rem" }}>
                            {prod.category.customizations.length} custom.
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT / BOTTOM: customizations sidebar */}
          {sidebarProduct && (
            <div style={{
              // Desktop: fixed right column
              // Mobile: fixed height strip at the bottom
              borderTop: "1px solid #dee2e6",
              borderLeft: "none",
              backgroundColor: "var(--bs-tertiary-bg)",
              overflowY: "auto",
              padding: "1rem",
            }}
              className="border-md-start border-md-top-0"
              // On md+ override to side panel via inline + Bootstrap utility below
            >
              {/* On md+ make it a right column */}
              <style>{`
                @media (min-width: 768px) {
                  .sidebar-panel {
                    width: 260px;
                    min-width: 260px;
                    border-left: 1px solid #dee2e6 !important;
                    border-top: none !important;
                  }
                }
                @media (max-width: 767px) {
                  .sidebar-panel {
                    max-height: 40vh;
                    border-top: 1px solid #dee2e6;
                  }
                }
              `}</style>
              <div className="sidebar-panel h-100" style={{ display: "flex", flexDirection: "column" }}>
                <h6>{sidebarProduct.name}</h6>
                <p className="text-muted small mb-1">
                  Classic (default size): <strong>{sidebarProduct.price.toFixed(2)} €</strong>
                </p>

                {/* Sizes */}
                {sidebarProduct.category?.sizes?.length > 0 && (
                  <>
                    <p className="fw-semibold small mb-1">Size:</p>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {sidebarProduct.category.sizes.map((size) => {
                        const isSelected = selectedSize?.name === size.name;
                        const finalPrice = size.base_price > 0 
                          ? size.base_price 
                          : sidebarProduct.price + (size.price_change || 0);
                        return (
                          <button
                            key={size.name}
                            type="button"
                            className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size.name}
                            <span className="ms-1" style={{ fontSize: "0.7rem" }}>
                              {finalPrice.toFixed(2)}€
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {!selectedSize && (
                      <small className="text-danger mb-2">Please select a size</small>
                    )}
                  </>
                )}

                {/* Customizations */}  {/* Group customizations by type */}
                {sidebarCustomizations.length > 0 ? (
                  <>
                    {/* Single-select groups */}
                    {(() => {
                      const singleItems = sidebarCustomizations.filter((c) => c.type === "single");
                      const multiItems = sidebarCustomizations.filter((c) => !c.type || c.type === "multi");
                      
                      return (
                        <>
                          {/* Single select — radio buttons */}
                          {singleItems.length > 0 && (
                            <>
                              <p className="fw-semibold small mb-1">
                                Choose one: <span className="text-danger">*</span>
                              </p>
                              <div style={{ overflowY: "auto" }}>
                                {singleItems.map((cust) => {
                                  const isSelected = checkedCustomizations.includes(cust.name);
                                  return (
                                    <div
                                      key={cust.name}
                                      className={`d-flex align-items-center gap-2 p-2 mb-1 rounded ${
                                        isSelected ? "bg-warning bg-opacity-20 border border-warning" : "border"
                                      }`}
                                      style={{ 
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? undefined : "var(--bs-body-bg)",
                                       }}
                                      onClick={() => {
                                        // Single select — deselect all others in single group, select this one
                                        setCheckedCustomizations((prev) => {
                                          const withoutSingles = prev.filter(
                                            (name) => !singleItems.find((s) => s.name === name)
                                          );
                                          return [...withoutSingles, cust.name];
                                        });
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        className="form-check-input mt-0"
                                        checked={isSelected}
                                        onChange={() => {}}
                                      />
                                      <span className="flex-grow-1" style={{ fontSize: "0.85rem" }}>{cust.name}</span>
                                      {cust.price > 0 && (
                                        <span className="text-success small fw-semibold">+{cust.price.toFixed(2)}€</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}

                          {/* Multi select — checkboxes */}
                          {multiItems.length > 0 && (
                            <>
                              <p className="fw-semibold small mb-1 mt-2">Extras:</p>
                              <div style={{ overflowY: "auto", flex: 1 }}>
                                {multiItems.map((cust) => {
                                  const checked = checkedCustomizations.includes(cust.name);
                                  return (
                                    <div
                                      key={cust.name}
                                      className={`d-flex align-items-center gap-2 p-2 mb-1 rounded ${
                                        checked ? "bg-primary bg-opacity-10 border border-primary" : "border"
                                      }`}
                                      style={{ 
                                        cursor: "pointer",
                                        backgroundColor: checked ? undefined : "var(--bs-body-bg)", 
                                      }}
                                      onClick={() => toggleCustomization(cust.name)}
                                    >
                                      <input type="checkbox" className="form-check-input mt-0"
                                        checked={checked} onChange={() => toggleCustomization(cust.name)}
                                        onClick={(e) => e.stopPropagation()} />
                                      <span className="flex-grow-1" style={{ fontSize: "0.85rem" }}>{cust.name}</span>
                                      {cust.price > 0 && (
                                        <span className="text-success small fw-semibold">+{cust.price.toFixed(2)}€</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-muted small">No customizations available.</p>
                )}

                <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small">Total:</span>
                  <span className="fw-bold text-primary">
                    {((selectedSize?.base_price > 0 
                      ? selectedSize.base_price 
                      : sidebarProduct.price + (selectedSize?.price_change || 0)) + extraPrice).toFixed(2)} €
                  </span>
                </div>

                {/* Warning if single-select not chosen */}
                {sidebarCustomizations.filter((c) => c.type === "single").length > 0 &&
                  !sidebarCustomizations.filter((c) => c.type === "single").some((c) =>
                    checkedCustomizations.includes(c.name)
                  ) && (
                  <small className="text-danger d-block mb-1">
                    ⚠️ Please select a required option
                  </small>
                )}
                <button 
                  className="btn btn-primary btn-sm w-100 mb-1" 
                  onClick={handleConfirm}
                  disabled={sidebarProduct.category?.sizes?.length > 0 && !selectedSize||
                    (sidebarCustomizations.filter((c) => c.type === "single").length > 0 &&
                    !sidebarCustomizations.filter((c) => c.type === "single").some((c) =>
                      checkedCustomizations.includes(c.name)
                    ))
                  }
                >
                  Add to Order
                </button>
                <button className="btn btn-outline-secondary btn-sm w-100" onClick={closeSidebar}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Custom Pizza Modal */}
      {showCustomPizza && (
        <CustomPizzaModal
          ingredients={ingredients}
          sizes={categories.find((c) => c.id === selectedCategory)?.sizes || []}
          onClose={() => setShowCustomPizza(false)}
          onConfirm={(items) => {
            items.forEach((item) => onProductSelected(item, item.customizations));
            setShowCustomPizza(false);
          }}
        />
      )}
    </>,
    document.body
  );
}

// ------------------------------------
// Custom Pizza Modal
// ------------------------------------
function CustomPizzaModal({ ingredients, sizes, onClose, onConfirm }) {
  const CUSTOM_PIZZA_SIZES = sizes.length > 0
    ? sizes.map((s, i) => ({
        name: s.name,
        // Use price_change as offset from a manual base, or define fixed prices
        basePrice: s.custom_base_price || s.base_price || 0,
        twoIngExtra: s.two_ing_extra || 0,
        threeIngExtra: s.three_ing_extra || 0,
      }))
    : [ 
        { name: "Atomic", basePrice: 6.50, twoIngExtra: 0.50, threeIngExtra: 0.50 },
        { name: "Classic", basePrice: 8.00, twoIngExtra: 0.60, threeIngExtra: 0.60 },
        { name: "Family", basePrice: 11.00, twoIngExtra: 1.00, threeIngExtra: 1.00 },
      ];

  const [selectedSize, setSelectedSize] = useState(CUSTOM_PIZZA_SIZES[1] ?? CUSTOM_PIZZA_SIZES[0]);
    
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const freeCount = selectedIngredients.filter((i) => i.isFree).length;

  const dynamicBase = 
    freeCount >= 3
      ? selectedSize.basePrice + selectedSize.twoIngExtra + selectedSize.threeIngExtra
      : freeCount >= 2
        ? selectedSize.basePrice + selectedSize.twoIngExtra
        : selectedSize.basePrice;

  const [manualOverride, setManualOverride] = useState(false);
  const [overridePrice, setOverridePrice] = useState("");
  const effectiveBase = manualOverride ? parseFloat(overridePrice) || 0 : dynamicBase;

  function toggleIngredient(ing) {
    setSelectedIngredients((prev) => {
      const exists = prev.find((i) => i.id === ing.id);
      if (exists) {
        // Remove it and recalculate free slots
        const updated = prev.filter((i) => i.id !== ing.id);
        return recalculateFree(updated);
      } else {
        // Add it
        const updated = [...prev, { ...ing, isFree: prev.length < 3 }];
        return recalculateFree(updated);
      }
    });
  }

  function recalculateFree(items) {
    // Auto-mark first 3 as free, rest as charged
    // BUT respect manual overrides — if worker toggled, keep their choice
    return items.map((item, index) => ({
      ...item,
      isFree: item.manualOverride ? item.isFree : index < 3
    }));
  }

  function toggleFree(ingId) {
    // Worker manually overrides free/charged
    setSelectedIngredients((prev) =>
      prev.map((i) =>
        i.id === ingId
          ? { ...i, isFree: !i.isFree, manualOverride: true }
          : i
      )
    );
  }

  const extraPrice = selectedIngredients
    .filter((i) => !i.isFree)
    .reduce((sum, i) => sum + i.price, 0);

  const totalPrice = effectiveBase + extraPrice;

  function handleConfirm() {
    if (selectedIngredients.length === 0) {
      alert("Please select at least one ingredient.");
      return;
    }
    const customLabels = selectedIngredients.map((i) =>
      i.isFree
        ? i.name
        : `${i.name} (+${i.price.toFixed(2)}€)`
    );

    const productName = `Custom Pizza (${selectedSize.name})`;

    onConfirm([{
      id: null,  
      name: productName,
      quantity: 1,
      price: totalPrice,
      customizations: customLabels,
    }]);

  }

  const ingExtra =
    freeCount >= 3
      ? selectedSize.twoIngExtra + selectedSize.threeIngExtra
      : selectedSize.twoIngExtra;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 10004,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(540px, 95vw)",
        maxHeight: "90vh",
        backgroundColor: "var(--bs-body-bg)",
        borderRadius: "10px",
        zIndex: 10005,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div>
            <h5 className="mb-0 fw-bold">🍕 Make Your Own Pizza</h5>
            <small className="text-muted">First 3 ingredients included in base price</small>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>✕</button>
        </div>

        {/* Size selector */}
        {sizes.length > 0 && (
          <div className="px-3 pt-3 pb-2 border-bottom">
            <label className="form-label small fw-semibold">Size</label>
            <div className="d-flex flex-wrap gap-2">
              {CUSTOM_PIZZA_SIZES.map((size) => (
                <button
                  key={size.name}
                  type="button"
                  className={`btn btn-sm ${selectedSize?.name === size.name ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => {
                    setSelectedSize(size);
                    setManualOverride(false);  // reset override on size change
                    setOverridePrice("");
                  }}
                >
                  {size.name}
                  <span className="ms-1 fw-bold" style={{ fontSize: "0.75rem" }}>
                    {size.basePrice.toFixed(2)}€
                    {/* {size.threeIngExtra > 0 && (
                      <span className="text-warning ms-1">/ {(size.basePrice + size.threeIngExtra).toFixed(2)}€</span>
                    )} */}
                  </span>
                </button>
              ))}
            </div>
            {/* Dynamic hint below buttons */}
            {selectedSize.threeIngExtra > 0 && (
              <small className="text-muted mt-1 d-block">
                1 ingredient: <strong>{selectedSize.basePrice.toFixed(2)}€</strong> · 
                2 ingredients: <strong>{(selectedSize.basePrice + selectedSize.twoIngExtra).toFixed(2)}€</strong> ·
                3 ingredients: <strong>{(selectedSize.basePrice + selectedSize.twoIngExtra + selectedSize.threeIngExtra).toFixed(2)}€</strong>
              </small>
            )}
          </div>
        )}

        {/* Base price - manual override */}
        <div className="px-3 pt-3 pb-2 border-bottom">
          <label className="form-label small fw-semibold">Base Price (€) 
            <span className="text-muted fw-normal small ms-2">
              — {
              freeCount >= 3 
                ? "3-ingredient price" 
                : freeCount >= 2
                  ? "2-ingredient price" 
                  : "1-ingredient price"
              }
            </span>
          </label>
          {/* Dynamic price indicator for 2 or 3 ingredients */}
          <div className="text-danger fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
            {dynamicBase.toFixed(2)} €
            {freeCount >= 2 && ingExtra > 0 && (
              <small className="text-muted ms-2" style={{ fontSize: "0.75rem" }}>
                ({selectedSize.basePrice.toFixed(2)} + {ingExtra.toFixed(2)} surcharge)
              </small>
            )}
          </div>
          {/* Dynamic price indicator for 3-ing*/}
          {/* <div className="text-danger fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
            {dynamicBase.toFixed(2)} €
            {freeCount >= 3 && selectedSize.threeIngExtra > 0 && (
              <small className="text-muted ms-2" style={{ fontSize: "0.75rem" }}>
                ({selectedSize.basePrice.toFixed(2)} + {selectedSize.threeIngExtra.toFixed(2)} surcharge)
              </small>
            )}
          </div> */}
          <label className="form-label small text-muted mb-1">Override if needed:</label>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ maxWidth: 120 }}
            value={manualOverride ? overridePrice : dynamicBase.toFixed(2)}
            step="0.50"
            min="0"
            onChange={(e) => {
              setManualOverride(true);
              setOverridePrice(e.target.value);
            }}
          />
        </div>

        {/* Ingredients grid */}
                <div style={{ overflowY: "auto", flex: 1, padding: "1rem" }}>
          <p className="small text-muted mb-2">
            Tap to add · Toggle <span className="badge bg-success">FREE</span> / <span className="badge bg-danger">CHARGED</span> for each ingredient
          </p>
          {ingredients.length === 0 ? (
            <p className="text-muted text-center">No ingredients available. Add them in Menu Manager.</p>
          ) : (
            <div className="row g-2">
              {ingredients.map((ing) => {
                const isSelected = !!selectedIngredients.find((i) => i.id === ing.id);
                const isFree = selectedIngredients.find((i) => i.id === ing.id)?.isFree ?? false;
                return (
                  <div key={ing.id} className="col-6 col-sm-4">
                    <div
                      className={`card text-center h-100 ${
                        isSelected 
                          ? isFree
                            ? "border-success bg-success bg-opacity-10"
                            : "border-danger bg-danger bg-opacity-10" 
                          : ""
                      }`}
                      onClick={() => toggleIngredient(ing)}
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <div className="card-body p-2">
                        <div style={{ fontSize: "1.2rem" }}>🧀 🥓</div>
                        <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{ing.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {ing.price > 0 ? `+${ing.price.toFixed(2)} €` : "Included"}
                        </div>
                        {/* Free/Charged toggle — only show when selected */}
                        {isSelected && (
                          <button
                            type="button"
                            className={`btn btn-xs mt-1 py-0 px-1 ${isFree ? "btn-success" : "btn-danger"}`}
                            style={{ fontSize: "0.65rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFree(ing.id);
                            }}
                          >
                            {isFree ? "FREE" : `+${ing.price.toFixed(2)}€`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-top">
          {selectedIngredients.length > 0 && (
            <div className="small text-muted mb-2">
              Selected: {selectedIngredients.map((i) => (
                <span
                  key={i.id}
                  className={`badge me-1 ${i.isFree ? "bg-success" : "bg-danger"}`}
                >
                  {i.name}
                </span>
              ))}
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold">Total:</span>
            <span className="fw-bold text-danger fs-5">{totalPrice.toFixed(2)} €</span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger flex-grow-1"
              onClick={handleConfirm}
              disabled={selectedIngredients.length === 0}
            >
              Add to Order
            </button>
            <button className="btn btn-outline-secondary flex-grow-1" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
