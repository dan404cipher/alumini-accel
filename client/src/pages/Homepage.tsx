import React, { useState, useRef, useEffect } from "react";
import image1 from "../assets/image1.jpg.jpg";
import image2 from "../assets/image2.jpg.jpg";
import image3 from "../assets/image3.jpg.jpg";
import image4 from "../assets/image4.jpg";
import { useNavigate } from "react-router-dom";
import notableImg from "../assets/Notableimage.jpg";
import NotableDetailPage from "@/components/Notablealumini/Notabledetail";

const Home: React.FC = () => {
  const navigate = useNavigate();
  

  const newsData = [
    {
      id: 1,
      title: "Alumni Meetup 2025 Announced",
      content:
        "It's the perfect opportunity to reconnect with fellow alumni, meet industry leaders, and share ideas. The event will feature keynote sessions..."
    },
    {
      id: 2,
      title: "Alumni Spotlight",
      content:
        "Our alumni have made remarkable contributions across industries—whether it's leading successful startups, excelling in research..."
    },
    {
      id: 3,
      title: "Job Portal Update",
      content:
        "We are excited to welcome several leading organizations to our growing network of recruiters. These companies bring a range of opportunities..."
    },
    {
      id: 4,
      title: "Alumni Charity Event",
      content:
        "Our alumni recently organized a charity event to support local communities in need. The event included a fundraising gala, silent auction, and volunteer activities..."
    },
    {
      id: 5,
      title: "New Mentorship Program Launched",
      content:
        "We are thrilled to announce the launch of our new mentorship program, designed to connect students and young alumni with experienced professionals in their fields..."
    }
  ];

  const handleNewsClick = (id: number) => {
    navigate(`/news/${id}`);
  };

  const Directormsg = () => {
    navigate("/directormsg");
  };

  const SuccessStory = () => {
    navigate("/successstory");
  };

  const MentorshipProgram =() =>{
    navigate("/helpdesk");
  }

  // Notable alumini images array
  const images = Array(12).fill(notableImg); // Array of 12 identical images
  return (
    <div className="px-[5%] ">
      
      <div className="pt-2">
        <section
          className="relative text-center w-full py-20 bg-cover bg-center text-white "
          style={{
            backgroundImage: `url(${image4})`,
            height: "800px"
          }}
        >
          <div className="absolute inset-0 bg-yellow opacity-90">
            <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6 pb-8">
              <h1 className="text-5xl font-bold mb-4">Welcome to AlumniAccel</h1>
              <p className="text-lg max-w-2xl mx-auto">
                Connecting alumni, fostering career opportunities, and celebrating achievements. Join our
                network to stay updated with events, job postings, and recognition.
              </p>
            </div>
          </div>
        </section>

        {/*  Highlights */}
        <section className="py-20 px-3 bg-background">
          <div className="max-w-10xl ml-12">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Highlights</h2>

            <div className="grid md:grid-cols-3 gap-20">
              <div
                className="bg-white rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-200"
                onClick={Directormsg}
              >
                <img
                  src={image1}
                  alt="Director"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-4">Director's Message</h3>
                <p>
                  "Our alumni are the cornerstone of our institution. We are proud to see them excel in
                  various fields and contribute positively to society."
                </p>
              </div>

              <div
                className="bg-white rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-200 "
                onClick={SuccessStory}
              >
                <img
                  src={image3}
                  alt="Success Story"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-4">Success Story</h3>
                <p className="p-4 text-bold cursor-pointer">
                  Meet Jane Doe, who turned her startup idea into a thriving business and now mentors
                  upcoming graduates to achieve their dreams.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg text-center hover:bg-blue-700 hover:text-white transition-colors duration-200"
              onClick = {MentorshipProgram}
              >
                <img
                  src={image4}
                  alt="Mentorship"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-4">Mentorship Program</h3>
                <p className="cursor-pointer">
                  Our mentorship program connects students and young alumni with experienced
                  professionals to guide them in career and personal developments
                </p>
              </div>
            </div>
          </div>
        </section>

        {/*  News + Events */}
        <section className="py-12 px-6 bg-white shadow-md">
          <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>
              <ul className="space-y-4 cursor-pointer p-4">
                {newsData.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleNewsClick(item.id)}
                    className="pb-6 p-6 transition-colors duration-200 my-2 border-b border-gray-300 hover:text-blue-500"
                  >
                    <strong>{item.title}</strong> - {item.content.substring(0, 100)}...
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Events */}
            <div className="mt-8 lg:mt-0 bg-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6 text-blue-700">Upcoming Events</h3>
              <ul className="space-y-4">
                <li
                  className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm"
                  onClick={() => navigate(`reunion/1?type=reunion`)}
                >
                  <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
                    <div>Sept</div>
                    <div className="text-lg">15</div>
                    <div className="text-sm">2025</div>
                  </div>
                  <div className="ml-4">
                    <strong className="text-gray-800 text-lg">
                      Webinar on Entrepreneurship-reunion
                    </strong>
                    <p className="text-gray-600">
                      Join us for an interactive webinar on entrepreneurship and innovation.
                    </p>
                  </div>
                </li>

                <li
                  className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm"
                  onClick={() => navigate(`webinar/1?type=webinar`)}
                >
                  <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
                    <div>Dec</div>
                    <div className="text-lg">10</div>
                    <div className="text-sm">2025</div>
                  </div>
                  <div className="ml-4">
                    <strong className="text-gray-800 text-lg">Annual Alumni Meet</strong>
                    <p className="text-gray-600">
                      Celebrate with alumni from around the world at our annual meet.
                    </p>
                  </div>
                </li>

                <li
                  className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm"
                  onClick={() => navigate(`reunion/2?type=reunion`)}
                >
                  <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
                    <div>Mar</div>
                    <div className="text-lg">5</div>
                    <div className="text-sm">2026</div>
                  </div>
                  <div className="ml-4">
                    <strong className="text-gray-800 text-lg">Alumni Leadership Summit</strong>
                    <p className="text-gray-600">
                      Engage with thought leaders and alumni driving change.
                    </p>
                  </div>
                </li>
              </ul>

              {/* Past Events */}
              <div className="mt-8 lg:mt-0">
                <h3 className="text-2xl font-bold mb-6 text-blue-700">Events</h3>
                <ul className="space-y-4">
                  <li
                    className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm"
                    onClick={() => navigate(`/reunion/3?type=past`)}
                  >
                    <span className="font-semibold text-gray-700">Alumni Charity Event</span>
                    <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Nov 25, 2025-reunion
                    </span>
                  </li>
                  <li
                    className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm"
                    onClick={() => navigate(`/webinar/4?type=past`)}
                  >
                    <span className="font-semibold text-gray-700">
                      New Mentorship Program Launched
                    </span>
                    <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Oct 10, 2025-webinar
                    </span>
                  </li>
                  <li
                    className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm"
                    onClick={() => navigate(`/reunion/4?type=past`)}
                  >
                    <span className="font-semibold text-gray-700">Networking Night</span>
                    <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Dec 5, 2025-reunion
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/*  Alumni Moments */}
        <section className="py-12 px-6 cursor-pointer" onClick={() => navigate("/gallery")}>
          <h2 className="text-3xl font-bold text-center mb-8">Our Alumni Moments Gallery</h2>
          <div className="grid grid-cols-3 gap-6">
            <img
              src={image1}
              alt="Alumni Event 1"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <img
              src={image2}
              alt="Alumni Event 2"
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <img
              src={image3}
              alt="Alumni Event 3"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </section>

        <section className="py-12 bg-white shadow-sm">
  <h1 className="text-3xl font-bold text-center mb-8">Notable Alumini</h1>

  <div className="flex flex-wrap justify-center gap-4">
    {images.map((i, index) => (
      <img
        key={index}
        src={notableImg}
        alt="notable alumini"
        className="w-48 h-60 object-cover rounded shadow-md hover:scale-105 transition-transform cursor-pointer"
        onClick={() => navigate(`/notable`)} // navigate on click
      />
    ))}
  </div>
</section>
      </div>
    </div>
  );
};

export default Home;
