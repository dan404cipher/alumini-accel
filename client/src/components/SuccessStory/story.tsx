import React from "react";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";
import image4 from "../../assets/image4.jpg";
import { useNavigate } from "react-router-dom";
const newsData = [
  {
    id: 1,
    title: "Alumni Startup Success",
    image: image1,
    description:
      "Our alumni founded a groundbreaking startup that has gained international recognition...",
    date: "Aug 27, 2025",
  },
  {
    id: 2,
    title: "Global Research Collaboration",
    image: image2,
    description:
      "A team of our alumni collaborated with international researchers to publish an impactful paper...",
    date: "Aug 20, 2025",
  },
  {
    id: 3,
    title: "Alumni Sports Meet",
    image: image3,
    description:
      "Our annual alumni sports meet brought together former students from around the globe...",
    date: "Aug 15, 2025",
  },
  {
    id: 4,
    title: "Alumni Charity Drive",
    image: image4,
    description:
      "Alumni organized a charity event to support education for underprivileged children...",
    date: "Aug 10, 2025",
  },
];

const storiesRight = [
  {
    id: 5,
    title: "Mentorship Program Launch",
    image: image1,
    description:
      "Our alumni launched a mentorship program to guide current students in career growth...",
    date: "Aug 8, 2025",
  },
  {
    id: 6,
    title: "Innovation Hackathon",
    image: image2,
    description:
      "Alumni hosted a hackathon inspiring innovative solutions for real-world problems...",
    date: "Aug 5, 2025",
  },
  {
    id: 7,
    title: "Cultural Reunion",
    image: image3,
    description:
      "The alumni cultural reunion was filled with music, dance, and nostalgia...",
    date: "Aug 2, 2025",
  },
  {
    id: 8,
    title: "Global Networking Event",
    image: image4,
    description:
      "A global networking event allowed alumni to connect with professionals worldwide...",
    date: "Jul 30, 2025",
  },
];

const StoryPage: React.FC = () => {
     const navigate = useNavigate();

  const handleReadMore = (id: number) => {
    navigate(`/story/${id}`);
  };
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
        <header className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Success Stories
        </h1>
        </header>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Left Side */}
        <div className="space-y-6">
          {newsData.map((story) => (
            <div
              key={story.id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-shadow flex"
            >
              {/* Image */}
              <img
                src={story.image}
                alt={story.title}
                className="w-40 h-40 object-cover"
              />
              {/* Content */}
              <div className="p-4 flex flex-col justify-between">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  {story.title}
                </h2>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{story.date}</span>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                  onClick={() => handleReadMore(story.id)}>
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {storiesRight.map((story) => (
            <div
              key={story.id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-shadow flex"
            >
              {/* Image */}
              <img
                src={story.image}
                alt={story.title}
                className="w-40 h-40 object-cover"
              />
              {/* Content */}
              <div className="p-4 flex flex-col justify-between">
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  {story.title}
                </h2>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{story.date}</span>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition"
                  onClick={() => handleReadMore(story.id)}>
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryPage;
