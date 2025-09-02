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
  description: `Our alumni founded a groundbreaking startup that has gained international recognition. The journey started from college days and grew into a multi-million-dollar company, inspiring the next generation of students.

What began as a simple idea during late-night brainstorming sessions in the college library soon turned into a vision with purpose. With passion, determination, and relentless hard work, our alumni transformed a small project into a business model that challenged conventional norms.

The startup focused on solving real-world problems using innovation and technology. Initially, resources were scarce, but creativity and resilience filled the gaps. Every setback became a lesson, every obstacle a stepping stone toward greater achievements.

Within just a few years, the company began attracting attention from investors, industry leaders, and international clients. Their unique approach, combined with a strong work ethic, positioned them as leaders in their sector.

Recognition soon followed—awards, media coverage, and invitations to global conferences. What once started as a dream in college classrooms was now shaping industries across borders.

The company not only brought financial success but also created opportunities for hundreds of employees worldwide. It became a hub of innovation, encouraging young minds to think big and act boldly.

What makes this story truly special is the spirit of giving back. Despite their busy schedules, the founders continue to stay connected with the university. They conduct workshops, mentorship sessions, and guest lectures, sharing their journey with aspiring students.

Their story proves that with dedication, teamwork, and the courage to take risks, even the smallest ideas can grow into global movements.

Today, this startup stands as a beacon of inspiration, reminding everyone that success is not defined by resources but by vision and persistence.

The journey continues, and with every milestone, the message grows stronger: Dream big, start small, work hard, and success will follow.`,
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
        <div className="max-w-4xl mx-auto flex justify-between items-center py-6 px-6 gap-6">
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
      </div>

        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center"
        style={{ fontFamily: 'safari' }}>
          {story.title}
        </h1>

        {/* Subtitle */}
        <h2 className="text-lg text-gray-600 mb-6 text-center italic">
          {story.subtitle}
        </h2>
        {/* Date */}
         <p className="text-sm text-gray-500 text-right"> {story.date}</p>

        {/* Image */}
        <div className="flex justify-center mb-6">
          <img
            src={story.image}
            alt={story.title}
            className="rounded-lg w-full max-h-96 object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-loose text-justify mb-6 "
        style={{ fontFamily: 'TimesNewRoman', fontSize: '18px' }}>
          {story.description}
        </p>

        {/* Date */}
       
      

      {/* Footer Navigation */}
      
      </div>
    </div>
  );
};

export default StoryDetails;
