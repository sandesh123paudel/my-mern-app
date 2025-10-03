import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import InquiryForm from "./pages/InquiryForm";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import NotFound from "./components/404";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import OfferModal from "./components/OfferModal";

// Admin Components
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminUsers from "./pages/admin/Users";
import AdminMenu from "./pages/admin/Menu";

// Route Protection Component
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import LocationServices from "./pages/admin/LocationServices";
import CustomMenu from "./pages/admin/CustomOrderMenu";
import CouponManagement from "./pages/admin/Coupon";
import CalenderPage from "./pages/admin/CalenderPage";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
          },

          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #16a34a",
            },
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },

          error: {
            style: {
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #ef4444",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },

          loading: {
            style: {
              background: "#fffbeb",
              color: "#92400e",
              border: "1px solid #d97706",
            },
            iconTheme: {
              primary: "#d97706",
              secondary: "#ffffff",
            },
          },
        }}
      />
      {/* Offer Modal - Will show on first visit */}
      {/* <OfferModal /> */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <Header />
              <About />
              <Footer />
            </>
          }
        />
        <Route
          path="/menu"
          element={
            <>
              <Header />
              <Menu />
              <Footer />
            </>
          }
        />
        <Route
          path="/inquiry"
          element={
            <>
              <Header />
              <InquiryForm />
              <Footer />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Header />
              <Login />
              <Footer />
            </>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="calender" element={<CalenderPage />} />
          <Route path="location-services" element={<LocationServices />} />
          <Route path="custom-menu" element={<CustomMenu />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<CouponManagement />} />
          <Route path="menu" element={<AdminMenu />} />
        </Route>

        {/* 404 Catch-all Route */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <NotFound />
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
