import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import InquiryForm from "./pages/InquiryForm";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
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
              border: "1px solid #a4cd3d",
            },
            iconTheme: {
              primary: "#a4cd3d",
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
              background: "#fefbf3",
              color: "#492a00",
              border: "1px solid #492a00",
            },
            iconTheme: {
              primary: "#492a00",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/inquiry" element={<InquiryForm />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
