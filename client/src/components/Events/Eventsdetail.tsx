import React from "react";
import { useParams, useNavigate ,useSearchParams} from "react-router-dom";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";
 
export interface EventType {
  id: number;
  title: string;
  type: "webinar" | "reunion";
  date: string;
  image: string;
  content: string;
}

const eventsData :EventType[]= [
  {
    id: 1,
    title: "Alumni Reunion 2021",
    type: "reunion",
    date: "2025-12-15",
    image: image1,
    content:
      "Join us for the grand Alumni Reunion 2025 where old friends meet again, share memories, and create new bonds. This event will feature cultural programs, networking sessions, and a gala dinner to celebrate our shared journey. ".repeat(
        20
      ), // repeated to make long content
  },
  {
    id: 2,
    title: "AI Webinar 2022",
    type: "webinar",
    date: "2025-09-10",
    image: image2,
    content:
      "A webinar that explores the latest trends in Artificial Intelligence, covering deep learning, machine learning, and real-world case studies by industry experts. Attendees will gain insights into AI applications across industries and learn practical skills that can be applied in their careers. ".repeat(
        20
      ),
  },
  {
    id: 3,
    title: "Alumni Meetup 2023",
    type: "reunion",
    date: "2024-08-20",
    image: image3,
    content:
      "Relive the memories from the Alumni Meetup 2024 where hundreds of alumni joined for a day full of networking, fun activities, and campus nostalgia. The event included panel discussions, cultural shows, and interactive games that brought everyone closer together while revisiting the golden college days. ".repeat(
        20
      ),
  },{
    id: 4,
    title: "Tech Symposium 2024 ",
    type: "reunion",
    date: "2024-11-05",
    image: image1,
    content:
      "The Tech Symposium 2024 was a landmark event that brought together tech enthusiasts, professionals, and students to discuss emerging technologies, innovation, and future trends. The symposium featured keynote speeches from industry leaders, technical workshops, and networking opportunities that fostered collaboration and knowledge sharing among attendees. ".repeat(
        20
      ),
    },{ 
    id: 5,
    title: "Cultural Fest 2025",
    type: "webinar",    

    date: "2023-10-12",
    image: image2,
    content:
      "The Cultural Fest 2023 was a vibrant celebration of art, music, and dance, showcasing the diverse talents of our alumni community. The fest included performances by renowned artists, interactive workshops, and exhibitions that highlighted cultural heritage and contemporary creativity. It was a joyous occasion that brought together people from all walks of life to celebrate culture and camaraderie. ".repeat(
        20
      ),

},{
    id: 6,
    title: "Startup Webinar 2026",
    type: "webinar",
    date: "2024-06-18",
    image: image3,      
    content:
      "The Startup Webinar 2024 provided aspiring entrepreneurs with valuable insights into launching and scaling successful startups. The webinar featured sessions on business planning, funding strategies, marketing, and growth hacking, led by experienced founders and investors. Participants had the opportunity to engage in Q&A sessions, network with peers, and gain practical knowledge to kickstart their entrepreneurial journey. ".repeat(
        20
      ),
  }
];

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type");

  // Find the clicked event
  const event = eventsData.find((e) => e.id === Number(id) && e.type === type);

  if (!event) {
    return <h1 className="p-6 text-red-500 text-center">Event not found</h1>;
  }

  // Check if upcoming or past
  const today = new Date();
  const eventDate = new Date(event.date);
  const status = eventDate >= today ? "Upcoming" : "Past";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() =>  navigate(type === "webinar" ? "/webinar" : "/reunion")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ← Back to {type === "webinar" ? "Webinars" : "Reunions"}
        </button>
      </div>

      {/* Event Poster */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-[500px] object-cover"
        />
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                event.type === "reunion"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {event.type.toUpperCase()}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${
                status === "Upcoming"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {status} Event
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          <p className="text-gray-500 mb-6">
            {new Date(event.date).toLocaleDateString()}
          </p>

          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {event.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
