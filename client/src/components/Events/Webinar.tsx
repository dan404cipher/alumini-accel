import React from "react";
import eventImg from "../../assets/image1.jpg.jpg";
import { Calendar, Clock, MapPin } from "lucide-react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

const events = [
  {
    id: 1,
    title: "AI & Future Careers",
    date: "Mar 10, 2025",
    time: "4:00 PM",
    location: "Online (Zoom)",
    content: "An expert session on how AI is shaping the job market.",
    image: eventImg,
    upcoming: true,
    type:"webinar",
  },
  {
    id: 2,
    title: "Leadership in Digital Era",
    date: "Apr 15, 2025",
    time: "5:30 PM",
    location: "Virtual Event",
    content: "Keynote on building leadership skills for the future.",
    image: eventImg,
    upcoming: false,
    type:"webinar",
  },
  {
    id: 3,
    title: "Tech Trends 2025",
    date: "May 20, 2025",
    time: "6:00 PM",
    location: "Online Webinar",
    content: "Exploring the latest trends in technology for businesses.",
    image: eventImg,
    upcoming: true,
    type:"webinar",
  },{
    id: 6,
    title: "Data Science Workshop",
    date: "Jun 18, 2025",
    time: "3:00 PM",
    location: "Virtual Event",
    content: "Hands-on workshop on data analysis and visualization techniques.",
    image: eventImg,
    upcoming: true,
    type:"webinar",
  },
];

const pastWebinars = [
  {
    id: 4,
    title: "Blockchain & Finance",
    date: "Nov 12, 2024",
    time: "3:00 PM",
    location: "Virtual Event",
    content: "Deep dive into blockchain’s impact on banking and finance.",
    image: eventImg,
    upcoming: false,
  },
  {
    id: 5,
    title: "Cybersecurity Awareness",
    date: "Sep 25, 2024",
    time: "2:00 PM",
    location: "Online",
    content: "Workshop on staying safe in the digital world.",
    image: eventImg,
    upcoming: false
  },
];

const Webinar: React.FC = () => {
    const navigate = useNavigate();
  const upcomingEvents = events.filter((e) => e.upcoming && e.type==="webinar");
  const pastEvents = events.filter((e) => !e.upcoming && e.type==="webinar");
  return (
    
    <div className="p-6 space-y-12">
         <div>
      <Navbar />
      
      {/* Events content */}
    </div>
        
      {/* Upcoming Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6"style={{fontFamily:"TimesNewRoman"}}>Upcoming Webinars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 cursor-pointer">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
onClick={() => navigate(`/events/${event.id}?type=webinar`)}
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
                <span className="text-[10px] font-bold text-blue-600 mb-1 uppercase">
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
        <h2 className="text-3xl font-bold mb-6 "style={{fontFamily:"TimesNewRoman"}}> Past Webinars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 cursor-pointer">
          {pastEvents.map((event) => (
            <div
              key={event.id}
            onClick={() => navigate(`/events/${event.id}?type=webinar`)}
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

export default Webinar;
