
import React,{ useState, useEffect } from "react";
import image1 from "../../assets/image1.jpg.jpg"
import image2 from "../../assets/image2.jpg.jpg"
import image3 from "../../assets/image3.jpg.jpg"
import image4 from "../../assets/image4.jpg";
import { format } from "date-fns";
import { useParams,useNavigate } from "react-router-dom";

interface News{
    id:number;
    title:string;
    subtitle:string;
    description:string;
    imageUrl:string;
    date:string;
}

const newsData:News[]=[{
    id:1,
    title:"Alumni Meet 2023",
    subtitle:"Reconnecting and Celebrating",
    description:"The annual alumni meet was held on 15th August 2023, bringing together graduates from various batches to reconnect, share experiences, and celebrate their achievements. The event featured keynote speeches, networking sessions, and cultural performances. It was a memorable day filled with nostalgia and inspiration.share experiences, and celebrate their achievements. The event featured keynote speeches, networking sessions, and cultural performances. It was a memorable day filled with nostalgia and inspiration,share experiences, and celebrate their achievements. The event featured keynote speeches, networking sessions, and cultural performances. It was a memorable day filled with nostalgia and inspiration,share experiences, and celebrate their achievements. The event featured keynote speeches, networking sessions, and cultural performances. It was a memorable day filled with nostalgia and inspiration.",
    imageUrl:image1,
    date:"2023-08-15"

},{
    id:2,
    title:"Alumni Spotlight: Jane Doe",
    subtitle:"From Graduate to Entrepreneur",
    description:"Jane Doe, a 2010 graduate, has successfully launched her own tech startup that focuses on sustainable solutions. Her journey from a student to a successful entrepreneur is an inspiration to many current students and alumni. She recently spoke at our annual alumni meet, sharing insights and advice for aspiring entrepreneurs. ",
    imageUrl:image2,
    date:"2023-09-10"
},{
    id:3,
    title:"New Job Portal Launched",
    subtitle:"Connecting Alumni with Opportunities",
    description:"We are excited to announce the launch of our new job portal, designed to connect alumni with job opportunities across various industries. The portal features job listings from top companies, resume building tools, and career resources. Alumni can now easily find and apply for jobs, as well as connect with recruiters looking for talented graduates.",
    imageUrl:image3,
    date:"2023-10-05"
},{
    id:4,
    title:"Alumni Charity Event",
    subtitle:"Giving Back to the Community",
    description:"Our alumni recently organized a charity event to support local communities in need. The event included a fundraising gala, silent auction, and volunteer activities. Thanks to the generosity of our alumni, we were able to raise significant funds to support various charitable causes, including education, healthcare, and disaster relief.",
    imageUrl:image4,
    date:"2023-11-20"
}];

const Newspage:React.FC=()=>{

    const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find index based on URL param
  const startIndex = id ? newsData.findIndex((n) => n.id === Number(id)) : 0;
  const [currentIndex, setCurrentIndex] = useState<number>(
    startIndex >= 0 ? startIndex : 0
  );

  useEffect(() => {
  const currentIdInUrl = Number(id);
  if (newsData[currentIndex].id !== currentIdInUrl) {
    navigate(`/news/${newsData[currentIndex].id}`, { replace: true });
  }
}, [currentIndex, id, navigate]);

  const currentNews = newsData[currentIndex];
  if (!currentNews) return <p>News not found</p>;

  const formattedDate = format(new Date(currentNews.date), "MMMM dd, yyyy");

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : newsData.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < newsData.length - 1 ? prev + 1 : 0));
  };







return(
    <div className="min-h-screen bg-gray-50 pt-6"  >
    <div className="max-w-4xl mx-auto px-6 py-10 bg-white rounded-2xl shadow-lg">
{/* header */}
<header className="mb-6 text-center">
<h1 className="text-4xl font-extrabold text-gray-900 mb-2 ">{currentNews.title}</h1>
<p className="text-lg text-gray-600 italic pt-4 border-t border-gray-200">{currentNews.subtitle}</p>
<span className="text-sm text-gray-500">{formattedDate}</span>
</header>


{/* {Image Section } */}
<div className="mb-4  flex justify-center" >
    <img src ={currentNews.imageUrl} alt={currentNews.title} className=" rounded-lg shadow-md "
 style={{ width: "500px", height: "320px", objectFit: "cover" }}/>
</div>


{/* {Description Section} */}
<div className="mb-8">
    <p className="text-lg leading-loose text-black   text-justify"
     style={{ fontFamily: "Times New Roman, Times, serif" }}>{currentNews.description}
        
    </p>
</div>


{/* footer Section  */}
<footer className="flex justify-between pt-4 border-t border-gray-200">
    <button className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
    onClick={handlePrevious}>
        previous 
    </button>
    <button className="px-5 py-2 text-gray-800 rounded-lg bg-gray-300  hover:bg-blue-400 transition-colors"
    onClick={handleNext}>
        Next
    </button>
</footer>
    </div>
    </div>
)};
export default Newspage;