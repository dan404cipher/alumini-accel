import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";

// Example stories data
const stories = [
  {
    id: 1,
    title: "Alumni Startup Success",
    subtitle: "From Campus to Unicorn Startup",
    image: image1,
    description:
      "Our alumni founded a groundbreaking startup that has gained international recognition. The journey started from college days and grew into a multi-million-dollar company, inspiring the next generation of students.",
    date: "Aug 27, 2025",
  },
  {
    id: 2,
    title: "Global Research Collaboration",
    subtitle: "International Impact",
    image: image2,
    description:
      "A team of our alumni collaborated with global researchers to publish an impactful paper that changed the way industries approach sustainability and climate change policies.",
    date: "Aug 20, 2025",
  },
  {
    id: 3,
    title: "Alumni Sports Meet",
    subtitle: "Reunion Through Sports",
    image: image3,
    description:
      "The annual alumni sports meet brought together hundreds of former students. The event fostered camaraderie, competition, and lifelong memories on and off the field.",
    date: "Aug 15, 2025",
  },
];

const StoryDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const storyId = parseInt(id || "0");
  const story = stories.find((s) => s.id === storyId);

  const handleNavigation = (direction: "prev" | "next") => {
    const currentIndex = stories.findIndex((s) => s.id === storyId);
    if (direction === "prev" && currentIndex > 0) {
      navigate(`/story/${stories[currentIndex - 1].id}`);
    }
    if (direction === "next" && currentIndex < stories.length - 1) {
      navigate(`/story/${stories[currentIndex + 1].id}`);
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-600">
        Story not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Content */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 mt-10 flex-1">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
          {story.title}
        </h1>

        {/* Subtitle */}
        <h2 className="text-lg text-gray-600 mb-6 text-center italic">
          {story.subtitle}
        </h2>

        {/* Image */}
        <div className="flex justify-center mb-6">
          <img
            src={story.image}
            alt={story.title}
            className="rounded-lg w-full max-h-96 object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          {story.description}
        </p>

        {/* Date */}
        <p className="text-sm text-gray-500 text-right"> {story.date}</p>
      </div>

      {/* Footer Navigation */}
      <footer className="max-w-4xl mx-auto flex justify-between items-center py-6 px-6">
        <button
          onClick={() => handleNavigation("prev")}
          disabled={storyId === stories[0].id}
          className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <button
          onClick={() => handleNavigation("next")}
          disabled={storyId === stories[stories.length - 1].id}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </footer>
    </div>
  );
};

export default StoryDetails;
