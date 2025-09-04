import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin } from "lucide-react";
import Navbar from "./Navbar";
import eventImg from "../../assets/image1.jpg.jpg";

interface EventDetail {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  content: string;
  image: string;
  upcoming: boolean;
}

// New detailed data (not the same as Reunion list)
const detailedEvents: EventDetail[] = [
  {
    id: 1,
    title: "Alumni Meet 2025",
    date: "Feb 20, 2025",
    time: "6:00 PM",
    location: "Auditorium Hall",
    content:
      "This Alumni Meet 2025 brings together graduates across batches. " +
      "We will celebrate achievements, share experiences, and network. ".repeat(25), // 50+ lines
    image: eventImg,
    upcoming: true,
  },
  {
    id: 2,
    title: "Silver Jubilee Reunion",
    date: "Jul 12, 2025",
    time: "5:30 PM",
    location: "Main Campus",
    content:
      "Silver Jubilee Reunion marks 25 years of our alumni journey. " +
      "Join for cultural shows, gala dinner, and fun games. ".repeat(25),
    image: eventImg,
    upcoming: true,
  },
  {
    id: 3,
    title: "Golden Jubilee Reunion",
    date: "Aug 18, 2023",
    time: "7:00 PM",
    location: "Main Auditorium",
    content:
      "Golden Jubilee is a proud celebration of 50 years of legacy. " +
      "Speeches, awards, cultural programs, and musical night await you. ".repeat(
        25
      ),
    image: eventImg,
    upcoming: false,
  },
  {
    id: 4,
    title: "Batch 2000 Reunion",
    date: "Jan 15, 2024",
    time: "4:00 PM",
    location: "Campus Lawn",
    content:
      "Batch 2000 Reunion is a nostalgic gathering for all classmates. " +
      "Games, dinner, memory lane activities, and group photos. ".repeat(25),
    image: eventImg,
    upcoming: false,
  },
  {
    id: 5,
    title: "Batch 2015 Reunion",
    date: "Dec 30, 2024",
    time: "7:00 PM",
    location: "Campus Lawn",
    content:
      "Batch 2015 Reunion brings all friends back to campus. " +
      "A night of music, fun, food, and memorable laughter. ".repeat(25),
    image: eventImg,
    upcoming: true,
  },
];

const ReunionDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = detailedEvents.find((e) => e.id === Number(id));

  if (!event) {
    return <p className="p-6 text-red-600">Event not found!</p>;
  }

  return (
    <div className="p-6">
      <Navbar />

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
        {/* Back button */}
        <button
          onClick={() => navigate("/reunion")}
          className="absolute top-4 right-4 bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300 text-sm"
        >
          ← Back to Reunion
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-6">{event.title}</h1>

        {/* Image */}
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-96 object-cover rounded-lg mb-6"
        />

        {/* Upcoming / Past tag */}
        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            event.upcoming
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {event.upcoming ? "Upcoming Event" : "Past Event"}
        </span>

        {/* Date / Time / Location */}
        <div className="flex flex-wrap gap-6 text-gray-700 mt-4">
          <p className="flex items-center">
            <Calendar size={18} className="mr-2 text-gray-500" />
            {event.date}
          </p>
          <p className="flex items-center">
            <Clock size={18} className="mr-2 text-gray-500" />
            {event.time}
          </p>
          <p className="flex items-center">
            <MapPin size={18} className="mr-2 text-gray-500" />
            {event.location}
          </p>
        </div>

        {/* Long Content */}
        <p className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
          {event.content}
        </p>
      </div>
    </div>
  );
};

export default ReunionDetails;
