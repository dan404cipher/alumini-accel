import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import Navbar from "./Navbar";
import eventImg from "../../assets/image2.jpg.jpg"; // You can replace with actual webinar images

interface WebinarDetail {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  content: string;
  image: string;
  upcoming: boolean;
}

// New detailed data (not the same as Webinar list)
const detailedWebinars: WebinarDetail[] = [
  {
    id: 1,
    title: "AI & Future of Tech",
    date: "Mar 10, 2025",
    time: "4:00 PM",
    location: "Online (Zoom)",
    content:
      "Join us for a webinar exploring the role of Artificial Intelligence in shaping the future. " +
      "Industry experts will discuss real-world applications, ethical concerns, and opportunities. ".repeat(
        25
      ), // 50+ lines
    image: eventImg,
    upcoming: true,
  },
  {
    id: 2,
    title: "Startup Growth Strategies",
    date: "Apr 5, 2025",
    time: "6:00 PM",
    location: "Google Meet",
    content:
      "This session will highlight proven strategies for growing startups. " +
      "Hear from successful entrepreneurs about funding, scaling, and innovation. ".repeat(
        25
      ),
    image: eventImg,
    upcoming: true,
  },
  {
    id: 3,
    title: "Digital Marketing 101",
    date: "Sep 22, 2023",
    time: "5:00 PM",
    location: "Microsoft Teams",
    content:
      "An introductory webinar on digital marketing essentials. " +
      "Covers SEO, social media, branding, and advertising strategies. ".repeat(
        25
      ),
    image: eventImg,
    upcoming:true,
  },
  {
    id: 4,
    title: "Cybersecurity Awareness",
    date: "Nov 15, 2024",
    time: "3:00 PM",
    location: "Webex",
    content:
      "A must-attend webinar for all professionals on how to stay safe online. " +
      "Includes live demonstrations and expert advice. ".repeat(25),
    image: eventImg,
    upcoming: false,
  },
    {
    id: 5,
    title: "Cybersecurity Awareness",
    date: "Nov 15, 2024",
    time: "3:00 PM",
    location: "Webex",
    content:
      "A must-attend webinar for all professionals on how to stay safe online. " +
      "Includes live demonstrations and expert advice. ".repeat(25),
    image: eventImg,
    upcoming: false,
  },
  
];

const WebinarDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const webinar = detailedWebinars.find((w) => w.id === Number(id));

  if (!webinar) {
    return <p className="p-6 text-red-600">Webinar not found!</p>;
  }

  return (
    <div className="p-6">
      <Navbar />

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
        {/* Back button */}
        <button
          onClick={() => navigate("/webinar")}
          className="absolute top-4 right-4 bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300 text-sm"
        >
          ← Back to Webinar
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-6">
          {webinar.title}
        </h1>

        {/* Image */}
        <img
          src={webinar.image}
          alt={webinar.title}
          className="w-full h-full object-cover rounded-lg mb-6"
        />

        {/* Upcoming / Past tag */}
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            webinar.upcoming
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {webinar.upcoming ? "Upcoming Webinar" : "Past Webinar"}
        </span>

        {/* Date / Time / Location */}
        <div className="flex flex-wrap gap-6 text-gray-700 mt-4">
          <p className="flex items-center">
            <Calendar size={18} className="mr-2 text-gray-500" />
            {webinar.date}
          </p>
          <p className="flex items-center">
            <Clock size={18} className="mr-2 text-gray-500" />
            {webinar.time}
          </p>
          <p className="flex items-center">
            <MapPin size={18} className="mr-2 text-gray-500" />
            {webinar.location}
          </p>
        </div>

        {/* Long Content */}
        <p className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
          {webinar.content}
        </p>
      </div>
    </div>
  );
};

export default WebinarDetails;
