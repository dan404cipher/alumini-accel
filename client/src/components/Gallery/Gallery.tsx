import React, { useState } from "react";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";
import image4 from "../../assets/image4.jpg";
import { useNavigate } from "react-router-dom";

// Dummy Album Data
const albums = [
  {
    id: 1,
    title: "Alumni Meetup",
    date: "Jan 2023",
    cover: image1,
    photos: [image1, image2, image3],
  },
  {
    id: 2,
    title: "Cultural Fest",
    date: "Aug 2023",
    cover: image2,
    photos: [image2, image3, image4, image2, image3, image4],
  },
  {
    id: 3,
    title: "Workshop Session",
    date: "Dec 2024",
    cover: image3,
    photos: [image3, image4, image1],
  },
];

const Gallery: React.FC = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [active, setActive] = useState<"photo" | "video">("photo");

  const navigate = useNavigate();

  const handleClick = (type: "photo" | "video") => {
    setActive(type);
    navigate(type === "photo" ? "/gallery" : "/video"); // ✅ now it navigates
  };

  const handleNext = () => {
    if (selectedAlbum !== null && selectedIndex !== null) {
      setSelectedIndex(
        (prev) =>
          prev !== null
            ? (prev + 1) % albums[selectedAlbum].photos.length
            : 0
      );
    }
  };

  const handlePrev = () => {
    if (selectedAlbum !== null && selectedIndex !== null) {
      setSelectedIndex(
        (prev) =>
          prev !== null
            ? (prev - 1 + albums[selectedAlbum].photos.length) %
              albums[selectedAlbum].photos.length
            : 0
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Our Alumni Moments
      </h1>

      {/* Toggle Buttons */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-full p-1 flex shadow-md">
          <button
            onClick={() => handleClick("photo")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 
              ${
                active === "photo"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
              }`}
          >
             Photos
          </button>
          <button
            onClick={() => handleClick("video")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 
              ${
                active === "video"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
              }`}
          >
             Videos
          </button>
        </div>
      </div>

      {/* Card View for Albums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {albums.map((album, index) => (
          <div
            key={album.id}
            onClick={() => {
              setSelectedAlbum(index);
              setSelectedIndex(0);
            }}
            className="cursor-pointer bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={album.cover}
              alt={album.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold">{album.title}</h2>
              <p className="text-sm text-gray-500">{album.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Lightbox */}
      {selectedAlbum !== null && selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedAlbum(null);
                setSelectedIndex(null);
              }}
              className="absolute top-6 right-8 text-white text-3xl font-bold hover:text-red-500 z-50"
            >
              ✕
            </button>

            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-70 text-white text-2xl px-4 py-2 rounded-full hover:bg-gray-600"
            >
              ⟨
            </button>

            {/* Fullscreen Image */}
            <img
              src={albums[selectedAlbum].photos[selectedIndex]}
              alt="Selected"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-xl mb-6"
            />

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-70 text-white text-2xl px-4 py-2 rounded-full hover:bg-gray-600"
            >
              ⟩
            </button>

            {/* Thumbnails */}
            <div className="mt-4 w-full overflow-x-auto">
              <div className="flex justify-center space-x-4 pb-4 px-6">
                {albums[selectedAlbum].photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    className={`h-24 w-32 object-cover rounded-lg cursor-pointer shadow transition 
                      ${
                        idx === selectedIndex
                          ? "ring-4 ring-blue-500 scale-105"
                          : "hover:scale-105"
                      }`}
                    onClick={() => setSelectedIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
