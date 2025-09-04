import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, X, ChevronLeft, ChevronRight } from "lucide-react";
import video1 from "../../assets/video/video1.mp4";
import video2 from "../../assets/video/video2.mp4";
import video3 from "../../assets/video/video3.mp4";

const videos = [
  {
    id: 1,
    title: "Alumni Meetup Highlights",
    date: "Jan 2023",
    src: video1, 
    thumbnail: "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg",
  },
  {
    id: 2,
    title: "Cultural Fest Dance",
    date: "Aug 2023",
    src: video2,
    thumbnail: "https://images.pexels.com/photos/1181359/pexels-photo-1181359.jpeg",
  },
  {
    id: 3,
    title: "Workshop Session",
    date: "Dec 2024",
    src: video3,
    thumbnail: "https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg",
  },
];

const VideoGallery: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto play when switching
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [selectedVideo]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (selectedVideo !== null) {
      setSelectedVideo((prev) => (prev! + 1) % videos.length);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (selectedVideo !== null) {
      setSelectedVideo((prev) => (prev! - 1 + videos.length) % videos.length);
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-10 text-blue-700"
      style={{ fontFamily: "TimesNewRoman" }}>
     Our Alumni Videos
      </h1>

      {/* Thumbnails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video, index) => (
          <div
            key={video.id}
            onClick={() => {
              setSelectedVideo(index);
              setIsPlaying(false);
            }}
            className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-56 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-800">{video.title}</h2>
              <p className="text-sm text-gray-500">{video.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {selectedVideo !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-6xl">
            {/* Close */}
            <button
              onClick={() => {
                setSelectedVideo(null);
                setIsPlaying(false);
              }}
              className="absolute top-4 right-6 text-white hover:text-red-400 z-50"
            >
              <X size={36} />
            </button>

            {/* Prev */}
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-600 z-40"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Video */}
            <div className="relative flex justify-center">
              <video
                ref={videoRef}
                src={videos[selectedVideo].src}
                className="w-full max-h-[85vh] rounded-lg shadow-2xl"
                onEnded={() => setIsPlaying(false)}
                controls 
              />

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="absolute bottom-4 "
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
            </div>

            {/* Title */}
            <h2 className="text-white text-2xl font-semibold text-center mt-6">
              {videos[selectedVideo].title}
            </h2>
            <p className="text-gray-400 text-center">
              {videos[selectedVideo].date}
            </p>

            {/* Next */}
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-600 z-40"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGallery;
