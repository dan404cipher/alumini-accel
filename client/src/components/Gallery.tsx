import React, { useState } from "react";
import { X } from "lucide-react";
import image1 from "../assets/image1.jpg.jpg";
import image2 from "../assets/image2.jpg.jpg";
import image3 from "../assets/image3.jpg.jpg";
import image4 from "../assets/image4.jpg";

const photos = [
  { id: 1, src: image1, title: "Alumni Meetup" },
    { id: 2, src: image2, title: "Guest Lecture" },
    { id: 3, src: image3, title: "College Festival" },
    { id: 4, src: image4, title: "Workshop Session" },
    { id: 5, src:image1, title: "Startup Pitch" },
    { id: 6, src: image2, title: "Reunion Night" },
    { id: 7, src: image3, title: "Cultural Event" },
    { id: 8, src: image4, title: "Alumni Awards" },
    { id: 9, src: image1, title: "Tech Talk" },
    { id: 10, src: image2, title: "Networking Event" },
];

const Gallery: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((prev) =>
        prev !== null ? (prev + 1) % photos.length : 0
      );
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((prev) =>
        prev !== null ? (prev - 1 + photos.length) % photos.length : 0
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Our Alumni Moments
      </h1>

      {/* Grid with 6 photos per row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="cursor-pointer rounded-lg overflow-hidden shadow hover:scale-105 transition"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={photo.src}
              alt={photo.title}
              className="w-full h-32 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Modal / Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full text-center">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-2 right-10 text-red-700 text-xl font-bold hover:text-red-500"
            >
              ✕
            </button>

            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute -left-12 top-1/2 -translate-y-1/2 bg-gray-700 text-white px-2 py-2 rounded-full hover:bg-gray-600"
            >
              ⟨
            </button>

            {/* Selected Photo */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                {photos[selectedIndex].title}
              </h2>
              <img
                src={photos[selectedIndex].src}
                alt={photos[selectedIndex].title}
                className="mx-auto max-h-[600px] rounded-lg shadow"
              />
            </div>

            {/* Next Button */}
            <button
  onClick={handleNext}
  className="absolute -right-12 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-full hover:bg-gray-600"
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
