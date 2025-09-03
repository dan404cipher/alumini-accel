import React, { useState } from "react";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";
import image4 from "../../assets/image4.jpg";

// Dummy Album Data
const albums = [
  {
    id: 1,
    title: "Alumni Meetup",
    date: "Jan 2023",
    cover: image1, // ✅ just reference the imported image
    photos: [image1, image2, image3],
  },
  {
    id: 2,
    title: "Cultural Fest",
    date: "Aug 2023",
    cover: image2,
    photos: [image2, image3, image4,image2, image3, image4, image2, image3, image4, image2, image3, image4],
  },
  {
    id: 3,
    title: "Workshop Session",
    date: "Dec 2024",
    cover: image3,
    photos: [image3, image4, image1],
  },{
    id: 4,
    title: "Tech Symposium",
    date: "Mar 2024",
    cover: image4,
    photos: [image4, image1, image2, image4, image1, image2, image4, image1, image2],
  },{
    id: 5,
    title: "Annual Gala",
    date: "Nov 2023",
    cover: image1,
    photos: [image1, image3, image4],
  },{
    id: 6,
    title: "Networking Event",
    date: "Feb 2024",
    cover: image2,
    photos: [image2,image1, image4, image1,image4],},
];

const Gallery: React.FC = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

      {/* Card View for Albums */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {albums.map((album, index) => (
          <div
            key={album.id}
            onClick={() => {
              setSelectedAlbum(index);
              setSelectedIndex(0);
            }}
            className="cursor-pointer bg-white  shadow-md rounded-lg overflow-hidden hover:shadow-lg transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full text-center">
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedAlbum(null);
                setSelectedIndex(null);
              }}
              className="absolute top-2 right-4 text-red-700 text-xl font-bold hover:text-red-500"
            >
              ✕
            </button>
            

            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute -left-12 top-1/2 -translate-y-1/2 bg-gray-700 text-white px-3 py-2 rounded-full hover:bg-gray-600"
            >
              ⟨
            </button>

            {/* Selected Photo */}
            <div>
  {/* Title */}
  <h2 className="text-2xl font-semibold mb-4">
    {albums[selectedAlbum].title}
  </h2>

  {/* Big Preview */}
  <img
    src={albums[selectedAlbum].photos[selectedIndex]}
    alt="Selected"
    className="mx-auto max-h-[400px]  rounded-lg shadow"
  />
  <p className="text-gray-500 mt-2 text-center">
    {selectedIndex + 1} / {albums[selectedAlbum].photos.length}
  </p>
</div>

{/* Thumbnails - Horizontal Scroll */}
<div className="mt-6 overflow-x-auto">
  <div className="flex space-x-4 pb-2">
    {albums[selectedAlbum].photos.map((photo, idx) => (
      <img
        key={idx}
        src={photo}
        alt={`Photo ${idx + 1}`}
        className={`h-24 w-32 object-cover rounded-lg cursor-pointer shadow 
          ${idx === selectedIndex ? "ring-4 ring-blue-500" : ""}`}
        onClick={() => setSelectedIndex(idx)}
      />
    ))}
  </div>
</div>


            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute -right-12 top-1/2 -translate-y-1/2 bg-gray-700 text-white px-3 py-2 rounded-full hover:bg-gray-600"
            >
              ⟩
            </button>
          </div>


          
        </div>

        
      )}
    </div>
  );
};

export default Gallery;

