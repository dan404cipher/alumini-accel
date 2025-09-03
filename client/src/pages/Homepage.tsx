// import React from "react";
// import image1 from "../assets/image1.jpg.jpg"
// import image2 from "../assets/image2.jpg.jpg"
// import image3 from "../assets/image3.jpg.jpg"
// import image4 from "../assets/image4.jpg"
// import { useNavigate } from "react-router-dom";
// import { LogIn } from "lucide-react";
// import { ChevronDown } from "lucide-react";
// import { useState } from "react";

// const Home :React.FC = () => {
//   const navigate = useNavigate();
  

//   const newsData = [
//     {
//       id: 1,
//       title: "Alumni Meetup 2025 Announced",
//       content:
//         "It’s the perfect opportunity to reconnect with fellow alumni, meet industry leaders, and share ideas. The event will feature keynote sessions..."
//     },
//     {
//       id: 2,
//       title: "Alumni Spotlight",
//       content:
//         "Our alumni have made remarkable contributions across industries—whether it's leading successful startups, excelling in research..."
//     },
//     {
//       id: 3,
//       title: "Job Portal Update",
//       content:
//         "We are excited to welcome several leading organizations to our growing network of recruiters. These companies bring a range of opportunities..."
//     },{

//       id: 4,
//       title: "Alumni Charity Event",
//       content:
//         "Our alumni recently organized a charity event to support local communities in need. The event included a fundraising gala, silent auction, and volunteer activities..."
//     },{
//       id: 5,
//       title: "New Mentorship Program Launched",
//       content:
//         "We are thrilled to announce the launch of our new mentorship program, designed to connect students and young alumni with experienced professionals in their fields..."
//     }
//   ];
//   const [open, setOpen] = useState(false);
//   const handleNewsClick = (id: number) => {
//   navigate(`/news/${id}`);
// };

// const Directormsg = () => {
//   navigate('/directormsg');};


// const SuccessStory = () => {
//   navigate('/successstory');};

//     return(
//  <div className="px-[5%]">
//       {/* ✅ Navbar */}
//       <nav className="flex items-center justify-between py-4 px-6 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
//         {/* Left: Logo */}
//         <h1
//           className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
//           onClick={() => navigate("/")}
//         >
//           Alumni Accel
//         </h1>

//         {/* Center: Nav Links */}
//         <ul className="absolute left-1/2 transform -translate-x-1/2 flex space-x-10 text-gray-700 font-medium">
//           <li
//             className="cursor-pointer hover:text-blue-600"
//             onClick={() => navigate("/directormsg")}
//           >
//             About Us
//           </li>
//           <li
//             className="cursor-pointer hover:text-blue-600"
//             onClick={() => navigate("/events")}
//           >
//             Events
//           </li>
//           <li
//             className="cursor-pointer hover:text-blue-600"
//             onClick={() => navigate("/gallery")}
//           >
//             Gallery
//           </li>

//           {/* Dropdown */}
//           <li className="relative" onMouseLeave={() => setOpen(false)}>
//             <div
//               className="cursor-pointer flex items-center gap-1 hover:text-blue-600"
//               onClick={() => setOpen((o) => !o)}
//             >
//               Newsroom & Reflections <ChevronDown size={16} />
//             </div>

//             {open && (
//               <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
//                 <li
//                   onClick={() => {
//                     navigate("/news");
//                     setOpen(false);
//                   }}
//                   className="px-4 py-2 cursor-pointer hover:bg-gray-100"
//                 >
//                   News
//                 </li>
//                 <li
//                   onClick={() => {
//                     navigate("/successstory");
//                     setOpen(false);
//                   }}
//                   className="px-4 py-2 cursor-pointer hover:bg-gray-100"
//                 >
//                   Success Story
//                 </li>
//               </ul>
//             )}
//           </li>

//           <li
//             className="cursor-pointer hover:text-blue-600"
//             onClick={() => navigate("/fundraising")}
//           >
//             Fund Raising
//           </li>
//           <li
//             className="cursor-pointer hover:text-blue-600"
//             onClick={() => navigate("/more")}
//           >
//             More
//           </li>
//         </ul>

//         {/* Right: Login Button */}
//         <div
//           className="flex items-center space-x-2 cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//           onClick={() => navigate("/login")}
//         >
//           <LogIn size={20} />
//           <span>Login</span>
//         </div>
//       </nav>


      
      
//         <div  className=" pt-10">
//        <section  className="relative text-center w-full   py-20 bg-cover bg-center text-white"
//         style={{ backgroundImage: `url(${image4})`,
//     height:'600px' }}
//       >

//         {/* Overlay for better text visibility */}
//         <div className="absolute inset-0 bg-yellow opacity-90">

//         <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
//           <h1 className="text-5xl font-bold mb-4 " >Welcome to AlumniAccel</h1>
//           <p className="text-lg max-w-2xl mx-auto">
//             Connecting alumni, fostering career opportunities, and celebrating achievements. 
//             Join our network to stay updated with events, job postings, and recognition.
//           </p>
//         </div>
//         </div>
// </section>




// <section className="py-20 px-3 bg-background">
//   <div className="max-w-7xl ml-12">
//     <h2 className="text-3xl font-bold mb-12 text-center">Our Highlights</h2>

//     <div className="grid md:grid-cols-3 gap-10">
      
//       {/* Director's Message */}
//       <div
//         className="bg-white p-6 rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors"
//         onClick={Directormsg}
//       >
//         <img
//           src={image1}
//           alt="Director"
//           className="w-25 h-30 mx-auto mb-4 object-cover rounded-lg"
//         />
//         <h3 className="text-xl font-semibold mb-4">Director's Message</h3>
//         <p>
//           "Our alumni are the cornerstone of our institution. We are proud to see them
//           excel in various fields and contribute positively to society."
//         </p>
//       </div>

//       {/* Success Story */}
//       <div
//         className="bg-white p-6 rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors"
//         onClick={SuccessStory}
//       >
//         <img
//           src={image3}
//           alt="Success Story"
//           className="w-25 h-30 mx-auto mb-4 object-cover rounded-lg"
//         />
//         <h3 className="text-xl font-semibold mb-4">Success Story</h3>
//         <p>
//           Meet Jane Doe, who turned her startup idea into a thriving business and
//           now mentors upcoming graduates to achieve their dreams.
//         </p>
//       </div>

//       {/* Mentorship Program */}
//       <div
//         className="bg-white p-6 rounded-xl shadow-lg text-center hover:bg-blue-700 hover:text-white transition-colors"
//       >
//         <img
//           src={image4}
//           alt="Mentorship"
//           className="w-25 h-30 mx-auto mb-4 object-cover rounded-lg"
//         />
//         <h3 className="text-xl font-semibold mb-4">Mentorship Program</h3>
//         <p>
//           Our mentorship program connects students and young alumni with experienced
//           professionals to guide them in career and personal developments
//         </p>
//       </div>

//     </div>
//   </div>
// </section>


// {/* <section className="py-12 px-6 bg-white "   >
//     <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         <div>
//             <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>
//             <ul className="space-y-4 cursor-pointer" onClick={handleSubmit}>
//               <li className="border-4 pb-2 p-4 rounded-lg ">
//                 <strong>Alumni Meetup 2025 Announced</strong> - It’s the perfect opportunity to reconnect 
//                 with fellow alumni, meet industry leaders, and share ideas. The event will feature keynote 
//                 sessions by accomplished professionals, interactive panel discussions, and dedicated networking 
//                 spaces to help you expand your circle. We’ll also celebrate outstanding alumni achievements and 
//                 provide an evening filled with learning, collaboration, and enjoyment. Don’t miss this chance to 
//                 grow your professional network and be part of an inspiring community.
//               </li>
//               <li className="border-4 pb-2 p-4 rounded-lg">
//                 <strong>Alumni Spotlight</strong> - Our alumni have made remarkable contributions across
//                  industries—whether it's leading successful startups, excelling in research, making 
//                  advancements in technology, or driving positive change in their communities. Their 
//                  dedication and hard work continue to inspire current students and fellow graduates, 
//                  showcasing the strength and potential of our network. Stay connected to celebrate their 
//                 success stories and learn from their journeys.
//               </li>
//               <li className="border-4 pb-2 p-4 rounded-lg">
//                 <strong>Job Portal Update</strong> - We are excited to welcome several leading  
//                 organizations to our growing network of recruiters. These companies bring a range 
//                 of opportunities across industries, from technology and finance to healthcare and creative fields.
//                  This expansion means more job postings, internships, and career pathways for our alumni and students. Stay tuned to explore these openings and connect with top employers looking for talented
//                  individuals like you.
//               </li>
//             </ul>

//           </div> */}
//           <section className="py-12 px-6">
//     <h2 className="text-3xl font-bold text-center mb-8">Our Alumini Moments</h2>
//     <div className="grid grid-cols-3 gap-6">
//     <img src={image1} alt="Alumni Event 1" className="w-full h-auto rounded-lg" />
//     <img src={image2}alt="Alumni Event 2" className="w-full h-auto rounded-lg"/>
//     <img src={image3} alt="Alumni Event 3" className="w-full h-auto rounded-lg"/>
// </div>
// </section>

//            <section className="py-12 px-6 bg-white">
//         <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           <div>
//             <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>
//             <ul className="space-y-4 cursor-pointer">
//              {newsData.map((item) => (
// <li
//       key={item.id}
//       onClick={() => handleNewsClick(item.id)}
//       className="border-4 pb-2 p-4 rounded-lg hover:bg-gray-100"
//     >
//       <strong>{item.title}</strong> - {item.content.substring(0, 100)}...
//     </li>
// ))}
//             </ul>
//           </div>


//           <div>
//             <h3 className="text-2xl font-bold mb-4 text-blue-700">Upcoming Events</h3>
//             <ul className="space-y-4 cursor-pointer">
//               <li className="border-b pb-2">
//                 <strong>Webinar on Entrepreneurship</strong> - Sept 15, 2025
//               </li>
//               <li className="border-b pb-2">
//                 <strong>Annual Alumni Meet</strong> - Dec 10, 2025
//               </li>
//               <li className="border-b pb-2">
//                 <strong>Career Fair</strong> - Jan 20, 2026
//               </li>
//             </ul>
//           </div>

// </div>
// </section>




//         </div>
//        </div>

//     )
// }

// export default Home;






import React, { useState, useRef, useEffect } from "react";
import image1 from "../assets/image1.jpg.jpg"
import image2 from "../assets/image2.jpg.jpg"
import image3 from "../assets/image3.jpg.jpg"
import image4 from "../assets/image4.jpg"
import { useNavigate } from "react-router-dom";
import { LogIn, ChevronDown } from "lucide-react";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNewsClick = (id: number) => {
    navigate(`/news/${id}`);
  };

  const Directormsg = () => {
    navigate('/directormsg');
  };

  const SuccessStory = () => {
    navigate('/successstory');
  };

  const handleDropdownItemClick = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="px-[5%]">
      {/* ✅ Navbar */}
      <nav className="flex items-center justify-between py-4 px-6 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        {/* Left: Logo */}
        <h1
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          Alumni Accel
        </h1>

        {/* Center: Nav Links */}
        <ul className="absolute left-1/2 transform -translate-x-1/2 flex space-x-10 text-gray-700 font-medium items-center">
          <li
            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
            onClick={() => navigate("/directormsg")}
          >
            About Us
          </li>
          <li
            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
            onClick={() => navigate("/events")}
          >
            Events
          </li>
          <li
            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
            onClick={() => navigate("/gallery")}
          >
            Gallery
          </li>

          {/* Enhanced Tailwind Dropdown */}
          <li 
            className="relative" 
            ref={dropdownRef}
            onMouseLeave={() => setOpen(false)}
          >
            <div
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors duration-200 select-none"
              onClick={() => setOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={open}
              aria-haspopup="true"
              aria-label="Newsroom & Reflections menu"
            >
              Newsroom & Reflections 
              <ChevronDown 
                size={16} 
                className={`transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Dropdown Menu with Animation */}
            <div className={`absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transform transition-all duration-200 origin-top ${
              open 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              <ul className="py-2" role="menu">
                <li
                  onClick={() => handleDropdownItemClick("/news")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleDropdownItemClick("/news");
                    }
                  }}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors duration-150 focus:bg-gray-100 focus:outline-none"
                  tabIndex={0}
                  role="menuitem"
                >
                  <span className="text-gray-700 hover:text-gray-900">News</span>
                </li>
                <li
                  onClick={() => handleDropdownItemClick("/successstory")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleDropdownItemClick("/successstory");
                    }
                  }}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors duration-150 focus:bg-gray-100 focus:outline-none"
                  tabIndex={0}
                  role="menuitem"
                >
                  <span className="text-gray-700 hover:text-gray-900">Success Story</span>
                </li>
              </ul>
            </div>
          </li>

          <li
            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
            onClick={() => navigate("/fundraising")}
          >
            Fund Raising
          </li>
          <li
            className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
            onClick={() => navigate("/more")}
          >
            More
          </li>
        </ul>

        {/* Right: Login Button */}
        <div
          className="flex items-center space-x-2 cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={() => navigate("/login")}
        >
          <LogIn size={20} />
          <span>Login</span>
        </div>
      </nav>

      <div className="pt-10">
        <section className="relative text-center w-full py-20 bg-cover bg-center text-white"
          style={{ 
            backgroundImage: `url(${image4})`,
            height: '800px' 
          }}
        >
          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-yellow opacity-90">
            <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6 pb-8">
              <h1 className="text-5xl font-bold mb-4">Welcome to AlumniAccel</h1>
              <p className="text-lg max-w-2xl mx-auto">
                Connecting alumni, fostering career opportunities, and celebrating achievements. 
                Join our network to stay updated with events, job postings, and recognition.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-3 bg-background">
          <div className="max-w-10xl ml-12">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Highlights</h2>

            <div className="grid md:grid-cols-3 gap-20">
              
              {/* Director's Message */}
              <div
                className="bg-white  rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-200"
                onClick={Directormsg}
              >
                <img
                  src={image1}
                  alt="Director"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-4">Director's Message</h3>
                <p>
                  "Our alumni are the cornerstone of our institution. We are proud to see them
                  excel in various fields and contribute positively to society."
                </p>
              </div>

              {/* Success Story */}
              <div
                className="bg-white  rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors duration-200"
                onClick={SuccessStory}
              >
                <img
                  src={image3}
                  alt="Success Story"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold  mb-4">Success Story</h3>
                <p className="p-4 text-bold">
                  Meet Jane Doe, who turned her startup idea into a thriving business and
                  now mentors upcoming graduates to achieve their dreams.
                </p>
              </div>

              {/* Mentorship Program */}
              <div
                className="bg-white rounded-xl shadow-lg text-center hover:bg-blue-700 hover:text-white transition-colors duration-200"
              >
                <img
                  src={image4}
                  alt="Mentorship"
                  className="w-30 h-30 mx-auto mb-4 object-cover rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-4">Mentorship Program</h3>
                <p>
                  Our mentorship program connects students and young alumni with experienced
                  professionals to guide them in career and personal developments
                </p>
              </div>

            </div>
          </div>
        </section>

       
        <section className="py-12 px-6 bg-white shadow-md">
          <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 " >
            <div >
              <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>

              <ul className="space-y-4 cursor-pointer   p-4">
                 
                {newsData.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleNewsClick(item.id)}
                    className=" pb-6 p-6  transition-colors duration-200 my-2 border-b border-gray-300  hover:text-blue-500 "
                  >
                    <strong>{item.title}</strong> - {item.content.substring(0, 100)}...
                    
                    
                  </li>
                  
                ))}
               
              </ul>
              

            </div>

           <div className="mt-8 lg:mt-0 bg-white p-8 rounded-lg   ">
  <h3 className="text-2xl font-bold mb-6 text-blue-700">Upcoming Events</h3>
  <ul className="space-y-4">
    <li className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm">
      {/* Date Section */}
      <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
        <div>Sept</div>
        <div className="text-lg">15</div>
        <div className="text-sm">2025</div>
      </div>

      {/* Content Section */}
      <div className="ml-4">
        <strong className="text-gray-800 text-lg">Webinar on Entrepreneurship</strong>
        <p className="text-gray-600">Join us for an interactive webinar on entrepreneurship and innovation.</p>
      </div>
    </li>

    <li className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm">
      <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
        <div>Dec</div>
        <div className="text-lg">10</div>
        <div className="text-sm">2025</div>
      </div>
      <div className="ml-4">
        <strong className="text-gray-800 text-lg">Annual Alumni Meet</strong>
        <p className="text-gray-600">Celebrate with alumni from around the world at our annual meet.</p>
      </div>
    </li>

    {/* <li className="flex items-center bg-gray-50 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer">
      <div className="flex-shrink-0 bg-purple-600 text-white font-semibold px-2 py-2 rounded-lg text-center">
        <div>Jan</div>
        <div className="text-lg">20</div>
        <div className="text-sm">2026</div>
      </div>
      <div className="ml-4">
        <strong className="text-gray-800 text-lg">Career Fair</strong>
        <p className="text-gray-600">Explore new career opportunities and meet top employers.</p>
      </div>
    </li> */}

    {/* <li className="flex items-center bg-gray-50 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer">
      <div className="flex-shrink-0 bg-red-600 text-white font-semibold px-2 py-2 rounded-lg text-center">
        <div>Feb</div>
        <div className="text-lg">15</div>
        <div className="text-sm">2026</div>
      </div>
      <div className="ml-4">
        <strong className="text-gray-800 text-lg">Hackathon 2026</strong>
        <p className="text-gray-600">A two-day event to showcase coding and innovation skills.</p>
      </div>
    </li> */}

    <li className="flex items-center bg-white hover:bg-blue-100 rounded-lg p-2 transition-colors duration-200 cursor-pointer shadow-sm">
      <div className="flex-shrink-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-center">
        <div>Mar</div>
        <div className="text-lg">5</div>
        <div className="text-sm">2026</div>
      </div>
      <div className="ml-4">
        <strong className="text-gray-800 text-lg">Alumni Leadership Summit</strong>
        <p className="text-gray-600">Engage with thought leaders and alumni driving change.</p>
      </div>
    </li>
  </ul>


            
          
            <div className="mt-8 lg:mt-0">
  <h3 className="text-2xl font-bold mb-6 text-blue-700">Events</h3>
  <ul className="space-y-4">
    <li className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm">
      <span className="font-semibold text-gray-700">Alumni Charity Event</span>
      <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
        Nov 25, 2025
      </span>
    </li>
    <li className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm">
      <span className="font-semibold text-gray-700">New Mentorship Program Launched</span>
      <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
        Oct 10, 2025
      </span>
    </li>
    <li className="flex justify-between items-center bg-white hover:bg-blue-100 rounded-full px-6 py-3 transition-colors duration-200 cursor-pointer shadow-sm">
      <span className="font-semibold text-gray-700">Networking Night</span>
      <span className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full">
        Dec 5, 2025
      </span>
    </li>
  </ul>
</div>

            </div>
          </div>
        </section>

         <section className="py-12 px-6 cursor-pointer"
        onClick={() => navigate('/gallery')} >
          <h2 className="text-3xl font-bold text-center mb-8">Our Alumni Moments</h2>
          <div className="grid grid-cols-3 gap-6 " >
            <img src={image1} alt="Alumni Event 1" className="w-full h-auto rounded-lg shadow-lg" />
            <img src={image2} alt="Alumni Event 2" className="w-full h-auto rounded-lg shadow-lg"/>
            <img src={image3} alt="Alumni Event 3" className="w-full h-auto rounded-lg shadow-lg"/>
          </div>
        </section>


      </div>
    </div>
  )
}

export default Home;