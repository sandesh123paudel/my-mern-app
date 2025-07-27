import React, { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="shadow-sm relative z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-1">
              <Link to="/">
                <img
                  src="/Logo-full.svg"
                  alt="Catering Logo"
                  className="h-auto w-32 sm:w-40 lg:w-50"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 font-medium"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 font-medium"
              >
                About
              </Link>
              <Link
                to="/menu"
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 font-medium"
              >
                Menu
              </Link>
              <Link
                to="inquiry"
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 font-medium"
              >
                Inquiry
              </Link>
            </nav>

            {/* Desktop Login Button */}
            <div className="hidden md:flex">
              <button className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:text-primary-brown hover:border-primary-brown transition-all duration-300 font-medium">
                <img src="/catering.svg" alt="" className="h-5" />
                <span>Login</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-primary-brown transition-colors duration-300 p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex justify-end items-center p-6 border-gray-200">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-brown transition-colors duration-300 p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="text-xl flex flex-col items-center justify-center flex-1 space-y-8 px-6">
            <Link
              to="/"
              className="font-semibold text-gray-700 hover:text-primary-brown transition-colors duration-300"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="font-semibold text-gray-700 hover:text-primary-brown transition-colors duration-300"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              to="/menu"
              className="font-semibold text-gray-700 hover:text-primary-brown transition-colors duration-300"
              onClick={toggleMenu}
            >
              Menu
            </Link>
            <Link
              to="/inquiry"
              className="font-semibold text-gray-700 hover:text-primary-brown transition-colors duration-300"
              onClick={toggleMenu}
            >
              Inquiry
            </Link>

            {/* Mobile Login Button */}
            <button
              className="flex items-center space-x-3 px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:text-primary-brown hover:border-primary-brown transition-all duration-300 font-semibold text-lg mt-8"
              onClick={toggleMenu}
            >
              <img src="/catering.svg" alt="" className="h-5" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
