import React from "react";
import DirectorImage from "../assets/Directorimage.jpg";

const Directormsg: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 py-16 px-6 flex justify-center">
      <div className="max-w-6xl w-full rounded-3xl bg-white/80 backdrop-blur-lg shadow-2xl border border-gray-200 p-10">

        {/* Heading */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide uppercase bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Director's Message
          </h1>
        </header>

        {/* Content Section */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Image Section */}
          <div className="flex justify-center">
            <img
              src={DirectorImage}
              alt="Director"
              className="w-80 h-80 object-cover rounded-xl shadow-xl border-4 border-indigo-200"
            />
          </div>

          {/* Message Section */}
          <div className="text-gray-700 leading-relaxed">
            <blockquote className="text-xl md:text-2xl mb-6 font-serif italic text-indigo-700 border-l-4 border-indigo-400 pl-4">
              Education is not just about imparting knowledge, but about
              inspiring curiosity, nurturing creativity, and fostering values
              that last a lifetime.
            </blockquote>

            <p className="text-base md:text-lg font-light text-black text-justify">
              At <span className="font-semibold text-blue-600">AlumniAccel</span>,
              we believe that our alumni are the true ambassadors of our
              institution. Your achievements and contributions inspire future
              generations to dream big and work hard. This platform has been
              built to celebrate your success, reconnect bonds, and create
              opportunities for collaboration. Together, let us continue to
              shape a future filled with innovation, compassion, and excellence.
            </p>

            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-900">
                Dr. John Smith
              </h3>
              <p className="text-sm text-gray-500">Director, AlumniAccel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Directormsg;
