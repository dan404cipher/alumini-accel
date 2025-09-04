import React from "react";
import alum1 from "../../assets/notable1.jpeg";
import alum2 from "../../assets/notable2.jpeg";
import alum3 from "../../assets/Directorimage.jpg";
import { useState } from "react";

interface Alumini {
  id: number;
  name: string;
  position: string;
  location: string;
  description: string;
  image: string;
  degree:string;
  batch:string;
}

const aluminiData: Alumini[] = [
  
    {
  id: 1,
  name: "John Doe",
  position: "Software Engineer",
  location: "New York, USA",
  description: `John is a notable alumnus who has contributed significantly to the tech industry. 
He has been a speaker at various international conferences and has inspired many students. 
So far, he has worked on several groundbreaking projects that have transformed the way companies approach technology. 
John began his career with a strong foundation in software development and quickly rose to prominence for his innovative solutions. 
He has led teams on large-scale applications and has consistently demonstrated excellent problem-solving skills. 
In addition to his professional accomplishments, John is passionate about mentoring young engineers. 
He regularly conducts workshops and webinars to share his knowledge on software design, coding best practices, and emerging technologies. 
John has also published research papers and articles that have been widely cited in the industry. 
He has a unique ability to bridge the gap between technical execution and strategic vision. 
Many startups and established companies seek his advice on product development and digital transformation. 
His contributions have not only advanced business objectives but also inspired colleagues and peers. 
John is recognized for his collaborative approach, ensuring all team members are empowered to contribute ideas. 
He actively participates in tech communities, conferences, and hackathons worldwide. 
Outside of work, John engages in charitable initiatives, leveraging technology for social impact. 
He is known for his dedication, integrity, and a relentless drive to innovate. 
John’s mentorship has helped numerous students and young professionals achieve career success. 
He continuously explores new technologies, pushing the boundaries of what is possible in software development. 
Colleagues describe him as approachable, thoughtful, and highly motivating. 
His work has earned him several awards and industry recognitions over the years. 
John Doe’s journey exemplifies the spirit of innovation, dedication, and leadership in the tech world. 
He continues to inspire the next generation of engineers and leaders through his expertise and example.`,
  image: alum1,
  degree:"BE",
  batch:"2015",


  },
  {
    id: 2,
    name: "Jane Smith",
    position: "Marketing Head",
    location: "London, UK",
    description:
      `Jane has led multiple global marketing campaigns and inspired many students. ... and has been recognized with several awards. so far, she has transformed brand strategies for top companies.
      She is passionate about mentoring young marketers and regularly conducts workshops and webinars. Jane's innovative approach to marketing has set new industry standards.
      She has a knack for understanding market trends and consumer behavior, which has helped her create impactful campaigns.
      Jane is also an advocate for diversity and inclusion in the workplace, promoting equal opportunities for all.
      Her leadership style is collaborative, encouraging team members to share ideas and contribute to success.
      Jane's dedication to her craft and her ability to adapt to the ever-changing marketing landscape make her a standout professional in her field.
      She continues to inspire and lead by example, making significant contributions to the marketing industry.
    at the same time, she is known for her creativity, strategic thinking, and ability to drive results.
      Jane Smith's journey is a testament to the power of innovation, leadership, and mentorship in the marketing world.
        it continues to inspire the next generation of marketers through her work and dedication.
        at the same time, she is known for her creativity, strategic thinking, and ability to drive results.`,
    image: alum2,
     degree:"MSC",
  batch:"2024",
  },
  {
    id: 3,
    name: "Alice Johnson",
    position: "Data Scientist",
    location: "San Francisco, USA",
    description:
      `Alice has made groundbreaking contributions in data science. ... and continues to push the boundaries of what's possible with data.
      She has been a keynote speaker at several international conferences and has inspired many students.
      So far, she has developed innovative algorithms that have transformed data analysis in various industries.
      Alice is passionate about mentoring young data scientists and regularly conducts workshops and webinars.
      Her work has been published in top-tier journals, and she is recognized as a thought leader in her field.
      Alice's dedication to advancing data science and her commitment to education make her a notable alumna.
      She continues to inspire the next generation of data scientists through her expertise and mentorship.
      at the same time, she is known for her analytical skills, creativity, and ability to solve complex problems.
      Alice Johnson's journey exemplifies the impact of innovation, leadership, and mentorship in the field of data science.
        it continues to inspire the next generation of data scientists through her work and dedication.
        at the same time, she is known for her analytical skills, creativity, and ability to solve complex problems.`,
    image: alum3,
     degree:"BE(Civil)",
  batch:"2010",
  },
//   {
//     id: 4,
//     name: "Michael Brown",
//     position: "Product Manager",
//     location: "Toronto, Canada",
//     description:
//       `Michael has successfully launched several high-profile products. ... and has been recognized with multiple industry awards.
//       He has a talent for identifying market needs and translating them into successful product strategies.
//         So far, he has led cross-functional teams to deliver innovative solutions that drive business growth.
//         Michael is passionate about mentoring aspiring product managers and regularly shares his insights through workshops and webinars.
//         His leadership and strategic thinking have made a significant impact in the tech industry.
//         Michael's dedication to excellence and his ability to inspire teams make him a notable alumnus.
//         He continues to influence the next generation of product managers through his expertise and mentorship.`,
//     image: alum1,
//   }
];


    const NotableDetailPage: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(2); // show 2 initially

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 2); // load 2 more each time
  };
  return (
    <section className="py-12 px-4 md:px-16 bg-gray-50">
      <h1 className="text-4xl font-bold text-center mb-12">Notable Alumini</h1>

      <div className="space-y-8">
        {aluminiData.map((alum) => (
          <div
            key={alum.id}
            className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row"
          >
            {/* Image on left */}
            <img
              src={alum.image}
              alt={alum.name}
              className="w-full md:w-1/3 h-84 object-cover"
            />

            {/* Text on right, top-aligned */}
            <div className="md:w-2/3 p-6 flex flex-col justify-start items-start">
  <h2 className="text-2xl font-semibold mb-2">{alum.name}</h2>
  
  <p className="text-black mb-1">
    <strong>Position:</strong> {alum.position}
  </p>

  <p className="text-black mb-1">
    <strong>Degree:</strong> {alum.degree} {/* Add degree property in your data */}
  </p>

  <p className="text-black mb-1">
    <strong>Batch:</strong> {alum.batch} {/* Add batch property in your data */}
  </p>

  <p className="text-black mb-3">
    <strong>Location:</strong> {alum.location}
  </p>

  <p className="text-black">{alum.description}</p>
</div>
          </div>

        ))}
      </div>
        {visibleCount < aluminiData.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default NotableDetailPage;
