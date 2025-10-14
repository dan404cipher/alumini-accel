import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  Award,
  Globe,
  Building,
  Calendar,
  BookOpen,
  Target,
  Heart,
  Lightbulb,
} from "lucide-react";
import Footer from "@/components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Our College
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Empowering minds, building futures, and creating lasting
              connections that span generations.
            </p>
          </div>
        </div>
      </div>

      {/* College Image Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Campus
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A place where innovation meets tradition, and dreams take flight.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/src/assets/hero-alumni-network.jpg"
              alt="College Campus"
              className="w-full h-96 md:h-[500px] object-cover"
              onError={(e) => {
                // Fallback to a placeholder if the image doesn't exist
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold mb-2">
                Modern Learning Environment
              </h3>
              <p className="text-lg">
                State-of-the-art facilities for the next generation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">15,000+</h3>
              <p className="text-gray-600">Students</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">50+</h3>
              <p className="text-gray-600">Programs</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">25+</h3>
              <p className="text-gray-600">Years of Excellence</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">40+</h3>
              <p className="text-gray-600">Countries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Our Mission
                  </h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To provide world-class education that empowers students to
                  become innovative leaders, critical thinkers, and responsible
                  global citizens. We are committed to fostering academic
                  excellence, research innovation, and community engagement that
                  transforms lives and shapes the future.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Our Vision
                  </h3>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To be a globally recognized institution of higher learning
                  that inspires innovation, drives social change, and creates
                  lasting impact through education, research, and community
                  partnerships. We envision a future where our graduates lead
                  positive transformation in their communities and beyond.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do and shape our
              community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Excellence
                </h3>
                <p className="text-gray-600">
                  We strive for the highest standards in education, research,
                  and student development, continuously pushing boundaries and
                  setting new benchmarks for academic achievement.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Integrity
                </h3>
                <p className="text-gray-600">
                  We uphold the highest ethical standards, fostering trust,
                  transparency, and accountability in all our interactions and
                  decision-making processes.
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="bg-purple-100 text-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Community
                </h3>
                <p className="text-gray-600">
                  We foster a supportive, inclusive environment where diverse
                  perspectives are valued, collaboration is encouraged, and
                  lifelong connections are formed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From humble beginnings to becoming a beacon of educational
              excellence.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-6 flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    1998 - Foundation
                  </h3>
                  <p className="text-gray-600">
                    Our college was established with a vision to provide quality
                    education and create opportunities for students from all
                    backgrounds.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-6 flex-shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    2005 - Expansion
                  </h3>
                  <p className="text-gray-600">
                    Major campus expansion with new facilities, laboratories,
                    and modern infrastructure to support growing student
                    population.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-6 flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    2015 - Recognition
                  </h3>
                  <p className="text-gray-600">
                    Achieved national accreditation and recognition for
                    excellence in education, research, and community service.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center mr-6 flex-shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    2023 - Global Reach
                  </h3>
                  <p className="text-gray-600">
                    Established international partnerships and launched global
                    programs, connecting students with opportunities worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're a current student, alumni, or prospective student,
            you're part of our extended family. Connect with us and be part of
            our continued journey of excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="secondary" className="px-6 py-3 text-lg">
              <Users className="w-5 h-5 mr-2" />
              15,000+ Alumni Worldwide
            </Badge>
            <Badge variant="secondary" className="px-6 py-3 text-lg">
              <Award className="w-5 h-5 mr-2" />
              Award-Winning Programs
            </Badge>
            <Badge variant="secondary" className="px-6 py-3 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Global Recognition
            </Badge>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;
