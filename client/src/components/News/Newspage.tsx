import React, { useState, useEffect } from "react";
import image1 from "../../assets/image1.jpg.jpg";
import image2 from "../../assets/image2.jpg.jpg";
import image3 from "../../assets/image3.jpg.jpg";
import image4 from "../../assets/image4.jpg";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface News {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  date: string;
  type: "news" ;
}

const newsData: News[] = [
  {
    id: 1,
    title: "Alumni Meet 2025",
    subtitle: "Reconnecting and Celebrating",
    description:
      "The annual alumni meet was held on 15th August 2023, bringing together graduates from various batches to reconnect, share experiences, and celebrate their achievements...",
    imageUrl: image1,
    date: "2023-08-15",
    type: "news",
  },
  {
    id: 2,
    title: "Alumni Spotlight: Jane Doe",
    subtitle: "From Graduate to Entrepreneur",
    description:
      "Jane Doe, a 2010 graduate, has successfully launched her own tech startup...",
    imageUrl: image2,
    date: "2023-09-10",
    type: "news",
  },
  {
    id: 3,
    title: "New Job Portal Launched",
    subtitle: "Connecting Alumni with Opportunities",
    description:
      "We are excited to announce the launch of our new job portal, designed to connect alumni with job opportunities...",
    imageUrl: image3,
    date: "2023-10-05",
    type:   "news",
  },
  {
    id: 4,
    title: "Alumni Charity Event 2025 news",
    subtitle: "Giving Back to the Community",
    description:
      "Our alumni recently organized a charity event to support local communities in need...",
    imageUrl: image4,
    date: "2023-11-20",
    type: "news",
  },
   {
    id: 5,
    title: "Mentorship Program Launched for news",
    subtitle: "Guiding the Next Generation of Alumni Professionals ",
    description: `Whether you are a student seeking direction, or an alumnus/alumna ready to guide others, this program welcomes you to be a part of something impactful. Together, we can nurture talent, share experiences, and build a stronger future. Join us in making a difference through mentorship!

The Alumni Mentorship Program is designed to bridge the gap between aspiration and achievement. It connects enthusiastic learners with experienced professionals who have walked the same path, faced similar challenges, and discovered ways to overcome them.

Students often find themselves at crossroads—choosing the right career path, preparing for higher studies, or developing essential life skills. At these moments, a mentor’s guidance can make all the difference. Having someone who has been there before, who understands the journey, can provide invaluable clarity.

For alumni, mentorship is a way to give back. It is an opportunity to share wisdom, offer practical advice, and inspire the next generation. By guiding students, alumni not only shape individual careers but also strengthen the community as a whole.

This program is more than just conversations—it is about building meaningful relationships. Mentorship provides a safe space to ask questions, seek honest feedback, and learn beyond textbooks. It fosters confidence, encourages networking, and equips students with the tools to thrive in the professional world.

Mentors can support mentees in multiple ways—by helping them draft resumes, preparing them for interviews, introducing them to industry contacts, or simply being a sounding board for new ideas. These small acts of guidance can have a lifelong impact.

Mentees, on the other hand, bring fresh perspectives, curiosity, and energy. They remind mentors of their own journey and often spark new ideas through their questions. It becomes a two-way street of growth, where both mentor and mentee learn from each other.

The Alumni Mentorship Program also organizes workshops, networking events, and knowledge-sharing sessions. These create opportunities for group learning, where experiences are exchanged and community bonds are strengthened.

Imagine a network where students are never alone in their struggles, and alumni feel connected beyond their graduation years. That is what this program envisions—a thriving ecosystem of guidance, support, and collaboration.

We invite alumni from every field—whether you are a seasoned professional, an entrepreneur, a researcher, or an innovator—to step forward and share your journey. No matter how big or small, your story could be the turning point in someone else’s life.

For students, this is a chance to gain real-world insights. Beyond academics, mentorship helps in building resilience, communication skills, leadership abilities, and professional ethics. It prepares students not just for jobs, but for life.

Together, let’s transform dreams into realities. Let’s create a culture where guidance flows naturally, where experiences are passed down, and where every student has a mentor to lean on.

Your contribution as a mentor or mentee is not just about today—it is about creating a legacy. The time you invest now will ripple through the years, inspiring countless others to follow the same path of guidance and growth.

Be a mentor. Be a mentee. Be part of the change. Because mentorship is not just about advice—it’s about building bridges to the future.`,
    imageUrl: image1,
    date: "2023-12-15",
    type: "news",
  },{
    id: 6,
    title: "Alumni Tech Conference 2025 news",
    subtitle: "this is a subtitle",
    description: `Whether you are a student seeking direction, or an alumnus/alumna ready to guide others, this program welcomes you to be a part of something impactful. Together, we can nurture talent, share experiences, and build a stronger future. Join us in making a difference through mentorship!

The Alumni Mentorship Program is designed to bridge the gap between aspiration and achievement. It connects enthusiastic learners with experienced professionals who have walked the same path, faced similar challenges, and discovered ways to overcome them.

Students often find themselves at crossroads—choosing the right career path, preparing for higher studies, or developing essential life skills. At these moments, a mentor’s guidance can make all the difference. Having someone who has been there before, who understands the journey, can provide invaluable clarity.

For alumni, mentorship is a way to give back. It is an opportunity to share wisdom, offer practical advice, and inspire the next generation. By guiding students, alumni not only shape individual careers but also strengthen the community as a whole.

This program is more than just conversations—it is about building meaningful relationships. Mentorship provides a safe space to ask questions, seek honest feedback, and learn beyond textbooks. It fosters confidence, encourages networking, and equips students with the tools to thrive in the professional world.

Mentors can support mentees in multiple ways—by helping them draft resumes, preparing them for interviews, introducing them to industry contacts, or simply being a sounding board for new ideas. These small acts of guidance can have a lifelong impact.

Mentees, on the other hand, bring fresh perspectives, curiosity, and energy. They remind mentors of their own journey and often spark new ideas through their questions. It becomes a two-way street of growth, where both mentor and mentee learn from each other.

The Alumni Mentorship Program also organizes workshops, networking events, and knowledge-sharing sessions. These create opportunities for group learning, where experiences are exchanged and community bonds are strengthened.

Imagine a network where students are never alone in their struggles, and alumni feel connected beyond their graduation years. That is what this program envisions—a thriving ecosystem of guidance, support, and collaboration.

We invite alumni from every field—whether you are a seasoned professional, an entrepreneur, a researcher, or an innovator—to step forward and share your journey. No matter how big or small, your story could be the turning point in someone else’s life.

For students, this is a chance to gain real-world insights. Beyond academics, mentorship helps in building resilience, communication skills, leadership abilities, and professional ethics. It prepares students not just for jobs, but for life.

Together, let’s transform dreams into realities. Let’s create a culture where guidance flows naturally, where experiences are passed down, and where every student has a mentor to lean on.

Your contribution as a mentor or mentee is not just about today—it is about creating a legacy. The time you invest now will ripple through the years, inspiring countless others to follow the same path of guidance and growth.

Be a mentor. Be a mentee. Be part of the change. Because mentorship is not just about advice—it’s about building bridges to the future.`,
    imageUrl: image1,
    date: "2023-12-15",
    type: "news",
  }];

const Newspage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Set initial index based on param
  const startIndex = id ? newsData.findIndex((n) => n.id === Number(id)) : 0;
  const [currentIndex, setCurrentIndex] = useState<number>(
    startIndex >= 0 ? startIndex : 0
  );

  const currentNews = newsData[currentIndex];
  if (!currentNews) return <p>News not found</p>;

  // Keep URL in sync with currentNews.type & id
  useEffect(() => {
    if (id !== String(currentNews.id)) {
      navigate(
        `/${currentNews.type}/${currentNews.id}`,
        { replace: true }
      );
    }
  }, [currentNews, id, navigate]);

  const formattedDate = format(new Date(currentNews.date), "MMMM dd, yyyy");

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : newsData.length - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < newsData.length - 1 ? prev + 1 : 0
    );
  };

  return (
  <div className="min-h-screen bg-gray-100 flex justify-center items-start py-12 px-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg p-10 h-auto min-h-[750px]">
{/* Navigation */}
         <div className="flex justify-between items-center mb-6">
          <button
            className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            onClick={handlePrevious}
          >
            <ArrowLeft size={18} /> Previous
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
            onClick={handleNext}
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center"
        style={{ fontFamily: 'safari' }}>
          {currentNews.title}
        </h1>
        <p className="text-lg text-black mb-2 text-center"
        style={{ fontFamily: 'TimesNewRoman' }}>
          {currentNews.subtitle}
        </p>
        <span className="text-sm text-gray-400 block mb-6 text-center">
          {formattedDate}
        </span>

        {/* Image */}
        <div className="mb-6 flex justify-center">
          <img
            src={currentNews.imageUrl}
            alt={currentNews.title}
            className="w-full max-w-4xl h-[420px] object-cover rounded-xl"
          />
        </div>

        {/* Description */}
        <div className="text-gray-700 text-lg leading-relaxed space-y-4 px-2"
        style={{ fontFamily: 'TimesNewRoman' }}>
          {currentNews.description.split("\n").map((para, index) => (
            <p key={index}>{para}</p>
          ))}
        </div>

        
       </div>
    </div>
  );
};



export default Newspage;
