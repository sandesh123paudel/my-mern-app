import React from "react";

const HeroSection = () => {
  return (
    <>
      <section className="relative bg-gradient-to-br from-orange-50 to-white py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  DISCOVER CULINARY
                </h1>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  EXCELLENCE{" "}
                  <em className="text-orange-500 font-serif">with Feastar</em>
                </h1>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-md font-semibold  shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                EXPLORE OUR OFFERINGS
              </button>
            </div>

            {/* Orange Circle Accent */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-32 h-32 lg:w-48 lg:h-48 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <div className="text-white text-2xl lg:text-4xl font-bold">
                  ★
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
