import React from "react";
import eventImg from "../../assets/image1.jpg.jpg";
import { Calendar, Clock, MapPin } from "lucide-react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const events = [
  {
    id: 1,
    title: "Alumni Meet 2025",
    date: "Feb 20, 2025",
    time: "6:00 PM",
    location: "Auditorium Hall",
    content: "Annual alumni gathering with dinner & cultural programs.",
    image: eventImg,
    upcoming: true,
    type: "reunion",
  },
  {
    id: 2,
    title: "Silver Jubilee Reunion",
    date: "Jul 12, 2025",
    time: "5:30 PM",
    location: "Main Campus",
    content: "Celebrating 25 years of our alumni journey.",
    image: eventImg,
    upcoming: true,
    type: "reunion",
  },{
    id:5,
    title:"batch 2015 ",
    date:"Dec 30,2024",
    time:"7:00 PM",
    location:"Campus Lawn",
    content:"Catch-up evening for the 2015 batch alumni.",
    image:eventImg,
    upcoming:true,
    type: "reunion",

  },
  {
    id: 3,
    title: "Golden Jubilee Reunion",
    date: "Aug 18, 2023",
    time: "7:00 PM",
    location: "Main Auditorium",
    content: "Honoring 50 years of alumni legacy.",
    image: eventImg,
    upcoming: false,
    type: "reunion",
  },
  {
    id: 4,
    title: "Batch 2000 Reunion",
    date: "Jan 15, 2024",
    time: "4:00 PM",
    location: "Campus Lawn",
    content: "Catch-up evening for the 2000 batch alumni.",
    image: eventImg,
    upcoming:true,
    type: "reunion",
  },
];

const Reunion: React.FC = () => {
    const navigate = useNavigate();
  const upcomingEvents = events.filter((e) => e.upcoming && e.type === "reunion");
  const pastEvents = events.filter((e) => !e.upcoming && e.type === "reunion");
  return (
    <div className="p-6 space-y-12">
         <div>
              <Navbar />
              
              {/* Events content */}
            </div>
      {/* Upcoming Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6"style={{fontFamily:"TimesNewRoman"}}> Upcoming Reunions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 cursor-pointer">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/events/${event.id}?type=reunion`)}
              className="flex bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden h-28"
            >
              {/* Left: Image */}
              <div className="w-1/3">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Center: Content */}
              <div className="flex-1 p-3">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {event.content}
                </p>
                <p className="flex items-center text-gray-700 mt-1 text-sm">
                  <MapPin size={14} className="mr-1 text-gray-500" />
                  {event.location}
                </p>
              </div>

              {/* Right: Date & Status */}
              <div className="w-28 bg-white flex flex-col items-center justify-center p-2">
                <span className="text-[10px] font-bold text-green-600 mb-1 uppercase">
                  Upcoming
                </span>
                <p className="flex items-center text-gray-800 text-xs">
                  <Calendar size={12} className="mr-1 text-gray-500" />
                  {event.date}
                </p>
                <p className="flex items-center text-gray-800 text-xs mt-1">
                  <Clock size={12} className="mr-1 text-gray-500" />
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6"style={{fontFamily:"TimesNewRoman"}}> Past Reunions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow-md cursor-pointer">
          {pastEvents.map((event) => (
            <div
              key={event.id}
             onClick={() => navigate(`/events/${event.id}?type=reunion`)}
              className="flex bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden h-28"
            >
              {/* Left: Image */}
              <div className="w-1/3">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Center: Content */}
              <div className="flex-1 p-3">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {event.content}
                </p>
                <p className="flex items-center text-gray-700 mt-1 text-sm">
                  <MapPin size={14} className="mr-1 text-gray-500" />
                  {event.location}
                </p>
              </div>

              {/* Right: Date & Status */}
              <div className="w-28 bg-white flex flex-col items-center justify-center p-2">
                <span className="text-[10px] font-bold text-red-600 mb-1 uppercase">
                  Past
                </span>
                <p className="flex items-center text-gray-800 text-xs">
                  <Calendar size={12} className="mr-1 text-gray-500" />
                  {event.date}
                </p>
                <p className="flex items-center text-gray-800 text-xs mt-1">
                  <Clock size={12} className="mr-1 text-gray-500" />
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Reunion;
