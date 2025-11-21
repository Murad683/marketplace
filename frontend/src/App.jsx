// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";

// Pages
import ProductListPage from "./pages/ProductListPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import MerchantDashboardPage from "./pages/MerchantDashboardPage";
import CreateProductPage from "./pages/CreateProductPage";
import EditProductPage from "./pages/EditProductPage";
import MerchantOrdersPage from "./pages/MerchantOrdersPage";
import MerchantProductsPage from "./pages/MerchantProductsPage";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <Router>
      {/* root layout: bg & text hər iki tema üçün */}
      <div className="app-shell min-h-screen flex flex-col transition-colors">
        {/* HEADER */}
        <Header />

        {/* PAGE BODY */}
        <main className="flex-1">
          <Routes>
            {/* public / customer / merchant */}
            <Route path="/" element={<ProductListPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />

            {/* auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* customer */}
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* merchant */}
            <Route path="/merchant" element={<MerchantDashboardPage />} />
            <Route
              path="/merchant/create-product"
              element={<CreateProductPage />}
            />
            <Route
              path="/merchant/edit-product/:id"
              element={<EditProductPage />}
            />
            <Route path="/merchant/orders" element={<MerchantOrdersPage />} />

            {/* fallback */}
            <Route
              path="*"
              element={
                <div className="p-10 text-center text-red-500 dark:text-red-400">
                  404 - page not found
                </div>
              }
            />

            <Route path="/merchant/:id" element={<MerchantProductsPage />} />
          </Routes>
        </main>

        {/* FOOTER */}
        <footer className="text-center text-[11px] section-meta py-6 border-t divider">
          marketplace demo
        </footer>
      </div>
    </Router>
  );
}
