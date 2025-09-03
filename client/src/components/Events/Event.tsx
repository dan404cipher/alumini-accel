// import React, { useState } from "react";
// import { Calendar, Clock, MapPin } from "lucide-react";
// import eventImg from "../../assets/image1.jpg.jpg";
// import Navbar from "./Navbar";
// import { useNavigate } from "react-router-dom";
// // Dummy Events
// const events = [
//   {
//     id: 1,
//     title: "Alumni Reunion 2025",
//     type: "Reunion",
//     date: "Feb 20, 2025",
//     time: "6:00 PM",
//     location: "Auditorium Hall",
//     content: "A grand alumni reunion bringing together past graduates.",
//     image: eventImg,
//     upcoming: true,
//   },
//   {
//     id: 2,
//     title: "Tech Webinar on AI",
//     type: "Webinar",
//     date: "Mar 15, 2025",
//     time: "4:00 PM",
//     location: "Online (Zoom)",
//     content: "Join us for an insightful webinar on AI and its applications.",
//     image: eventImg,
//     upcoming: true,
//   },
//   {
//     id: 3,
//     title: "Cultural Fest 2024",
//     type: "Reunion",
//     date: "Nov 10, 2024",
//     time: "5:00 PM",
//     location: "Main Campus Ground",
//     content: "Annual cultural fest with music, dance, and fun.",
//     image: eventImg,
//     upcoming: false,
//   },
//   {
//     id: 4,
//     title: "Webinar on Startups",
//     type: "Webinar",
//     date: "Sep 12, 2024",
//     time: "3:00 PM",
//     location: "Online (Zoom)",
//     content: "Learn from top entrepreneurs about starting your journey.",
//     image: eventImg,
//     upcoming: false,
//   },
// ];

// const Events: React.FC = () => {
//     const navigate = useNavigate();
//   const [selectedType, setSelectedType] = useState<"reunion" | "webinar">(
//     "reunion"
//   );

//   const upcomingEvents = events.filter(
//     (e) => e.upcoming && e.type === selectedType
//   );
//   const pastEvents = events.filter(
//     (e) => !e.upcoming && e.type === selectedType
//   );

//   return (
//     <div className="p-8">
//         <div>
//       <Navbar />
      
//       {/* Events content */}
//     </div>
//       {/* Upcoming Events */}
//       <h2 className="text-3xl font-bold mb-8 pt-5 "
//       style={{fontFamily:"TimesNewRoman"}}> Upcoming Events</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16  cursor-pointer" >
//         {upcomingEvents.map((event) => (
//           <div
//             key={event.id}
//             onClick={() => navigate(`/events/${event.id}`)}
//             className="flex items-center bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 "
//           >
//             {/* Left Side: Text */}
//             <div className="flex-1 pr-4">
//               <span
//                 className={`inline-block text-xs px-3 py-1 rounded-full mb-2 ${
//                   event.type === "Reunion"
//                     ? "bg-green-100 text-green-700"
//                     : "bg-blue-100 text-blue-700"
//                 }`}
//               >
//                 {event.type}
//               </span>
//               <h3 className="text-lg font-semibold text-gray-800">
//                 {event.title}
//               </h3>
//               <p className="flex items-center text-sm text-gray-600 mt-1">
//                 <Calendar size={16} className="mr-2 text-gray-500" />
//                 {event.date} • {event.time}
//               </p>
//               <p className="flex items-center text-sm text-gray-600 mt-1">
//                 <MapPin size={16} className="mr-2 text-gray-500" />
//                 {event.location}
//               </p>
//             </div>

//             {/* Right Side: Image */}
//             <div className="w-28 h-28 flex-shrink-0">
//               <img
//                 src={event.image}
//                 alt={event.title}
//                 className="w-full h-full object-cover rounded-lg"
//               />
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Past Events */}
//       <h2 className="text-3xl font-bold mb-8 "style={{fontFamily:"TimesNewRoman"}}> Past Events</h2>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 cursor-pointer">
//         {pastEvents.map((event) => (
//           <div
//             key={event.id}
//             onClick={() => navigate(`/events/${event.id}`)}
//             className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
//           >
//             <img
//               src={event.image}
//               alt={event.title}
//               className="w-full h-40 object-cover"
//             />
//             <div className="p-4">
//               <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full">
//                 {event.type}
//               </span>
//               <h3 className="text-md font-semibold mt-2">{event.title}</h3>
//               <p className="text-sm text-gray-500 mt-1 flex items-center">
//                 <Calendar size={14} className="mr-2 text-gray-600" />
//                 {event.date}
//               </p>
//               <p className="text-sm text-gray-500 flex items-center">
//                 <Clock size={14} className="mr-2 text-gray-600" />
//                 {event.time}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Events;
