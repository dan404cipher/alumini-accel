import React from "react";
import image1 from "../assets/image1.jpg.jpg"
import image2 from "../assets/image2.jpg.jpg"
import image3 from "../assets/image3.jpg.jpg"
import image4 from "../assets/image4.jpg"
import { useNavigate } from "react-router-dom";

const Home :React.FC = () => {
  const navigate = useNavigate();

  const newsData = [
    {
      id: 1,
      title: "Alumni Meetup 2025 Announced",
      content:
        "It’s the perfect opportunity to reconnect with fellow alumni, meet industry leaders, and share ideas. The event will feature keynote sessions..."
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
    },{

      id: 4,
      title: "Alumni Charity Event",
      content:
        "Our alumni recently organized a charity event to support local communities in need. The event included a fundraising gala, silent auction, and volunteer activities..."
    },{
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
  navigate('/directormsg');};


const SuccessStory = () => {
  navigate('/successstory');};

    return(
        <div>
       <section  className="relative text-center w-full   py-20 bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${image4})`,
    height:'600px' }}
      >

        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-yellow opacity-90">

        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
          <h1 className="text-5xl font-bold mb-4 " >Welcome to AlumniAccel</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Connecting alumni, fostering career opportunities, and celebrating achievements. 
            Join our network to stay updated with events, job postings, and recognition.
          </p>
        </div>
        </div>
</section>

<section className="py-12 px-6">
    <h2 className="text-3xl font-bold text-center mb-8">Our Alumini Moments</h2>
    <div className="grid grid-cols-3 gap-6">
    <img src={image1} alt="Alumni Event 1" className="w-full h-auto rounded-lg" />
    <img src={image2}alt="Alumni Event 2" className="w-full h-auto rounded-lg"/>
    <img src={image3} alt="Alumni Event 3" className="w-full h-auto rounded-lg"/>
</div>
</section>


<section className="py-20 px-6 bg-background">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl font-bold mb-12 text-center">Our Highlights</h2>

    <div className="grid md:grid-cols-3 gap-8">
      
      {/* Director's Message */}
      <div className="bg-white p-6 rounded-xl shadow-lg text-center cursor-pointer hover:bg-blue-700 hover:text-white transition-colors"
      onClick={Directormsg} >
        <h3 className="text-xl font-semibold mb-4  ">Director's Message</h3>
        <p>
          "Our alumni are the cornerstone of our institution. We are proud to see them
          excel in various fields and contribute positively to society."
        </p>
      </div>

      {/* Success Story */}
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:bg-blue-700 hover:text-white transition-colors"
      onClick={SuccessStory}>
        <h3 className="text-xl font-semibold mb-4">Success Story</h3>
        <p>
          Meet Jane Doe, who turned her startup idea into a thriving business and
          now mentors upcoming graduates to achieve their dreams.
        </p>
      </div>

      {/* Mentorship Program */}
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:bg-blue-700 hover:text-white transition-colors">
        <h3 className="text-xl font-semibold mb-4">Mentorship Program</h3>
        <p>
          Our mentorship program connects students and young alumni with experienced
          professionals to guide them in career and personal development.
        </p>
      </div>

    </div>
  </div>
</section>

{/* <section className="py-12 px-6 bg-white "   >
    <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>
            <ul className="space-y-4 cursor-pointer" onClick={handleSubmit}>
              <li className="border-4 pb-2 p-4 rounded-lg ">
                <strong>Alumni Meetup 2025 Announced</strong> - It’s the perfect opportunity to reconnect 
                with fellow alumni, meet industry leaders, and share ideas. The event will feature keynote 
                sessions by accomplished professionals, interactive panel discussions, and dedicated networking 
                spaces to help you expand your circle. We’ll also celebrate outstanding alumni achievements and 
                provide an evening filled with learning, collaboration, and enjoyment. Don’t miss this chance to 
                grow your professional network and be part of an inspiring community.
              </li>
              <li className="border-4 pb-2 p-4 rounded-lg">
                <strong>Alumni Spotlight</strong> - Our alumni have made remarkable contributions across
                 industries—whether it's leading successful startups, excelling in research, making 
                 advancements in technology, or driving positive change in their communities. Their 
                 dedication and hard work continue to inspire current students and fellow graduates, 
                 showcasing the strength and potential of our network. Stay connected to celebrate their 
                success stories and learn from their journeys.
              </li>
              <li className="border-4 pb-2 p-4 rounded-lg">
                <strong>Job Portal Update</strong> - We are excited to welcome several leading  
                organizations to our growing network of recruiters. These companies bring a range 
                of opportunities across industries, from technology and finance to healthcare and creative fields.
                 This expansion means more job postings, internships, and career pathways for our alumni and students. Stay tuned to explore these openings and connect with top employers looking for talented
                 individuals like you.
              </li>
            </ul>

          </div> */}

           <section className="py-12 px-6 bg-white">
        <h2 className="text-3xl font-bold text-center mb-8">Latest Updates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">News</h3>
            <ul className="space-y-4 cursor-pointer">
             {newsData.map((item) => (
<li
      key={item.id}
      onClick={() => handleNewsClick(item.id)}
      className="border-4 pb-2 p-4 rounded-lg hover:bg-gray-100"
    >
      <strong>{item.title}</strong> - {item.content.substring(0, 100)}...
    </li>
))}
            </ul>
          </div>


          <div>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">Upcoming Events</h3>
            <ul className="space-y-4 cursor-pointer">
              <li className="border-b pb-2">
                <strong>Webinar on Entrepreneurship</strong> - Sept 15, 2025
              </li>
              <li className="border-b pb-2">
                <strong>Annual Alumni Meet</strong> - Dec 10, 2025
              </li>
              <li className="border-b pb-2">
                <strong>Career Fair</strong> - Jan 20, 2026
              </li>
            </ul>
          </div>

</div>
</section>




        </div>
       

    )
}

export default Home;