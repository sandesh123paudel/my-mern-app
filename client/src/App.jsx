import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import InquiryForm from "./pages/InquiryForm";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Footer from "./components/Footer";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
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
