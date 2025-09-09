import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// ✅ Extended funds array with descriptions
const funds = [
  {
    id: 1,
    title: "A Classroom (Hall) Named with Gratitude",
    description:
      "Honor your loved ones by dedicating a classroom or hall, as a lasting tribute to your support for education.",
    details: `We are thrilled to announce an exciting initiative to recognize your contributions...`, // 🔹 Full detail text here
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 2,
    title: "Empowering Scholars: Help Fund Their Journey",
    description:
      "Support scholars with travel grants to attend conferences, share research, and collaborate globally.",
    details: `Are you passionate about supporting academic research and the advancement of knowledge? Do you believe in empowering scholars to pursue their studies and contribute to society through their groundbreaking research? 
      
Why Travel Grants Matter:
1. Fostering Collaboration – Conferences foster collaboration and exchange of ideas.
2. Knowledge Sharing – Scholars often face financial constraints that limit conference participation.
3. Career Development – Attending academic events is crucial for networking, feedback, and professional growth.

Join Us in Empowering Scholars:
By supporting travel grants for scholars, you're investing in the future of knowledge.`,
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 3,
    title: "Rank Holders Endowment Fund",
    description:
      "Reward and support exceptional students, enabling them to pursue academic excellence without barriers.",
    details: `This fund recognizes top-performing students and provides sustainable financial support...`,
    raised: 450000,
    contributors: 1,
    fundedPercent: 45,
  },
  {
    id: 4,
    title: "Emergency Medical Fund for Student Parents",
    description:
      "Provide urgent medical support to student parents during crises, ensuring they continue education.",
    details: `Many student parents face unique challenges during medical emergencies...`,
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 5,
    title: "Chair Professorship Initiative",
    description:
      "Support endowed chair professorships to attract top scholars, foster research, and elevate education.",
    details: `A chair professorship attracts distinguished faculty, drives impactful research...`,
    raised: 0,
    contributors: 1,
    fundedPercent: 0,
  },
];

const ContributionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fund = funds.find((f) => f.id === Number(id));

  if (!fund) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Fund not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/funds")}
        >
          ← Back to Funds
        </Button>

        <Card className="shadow-lg rounded-2xl p-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800">
              {fund.title}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Details */}
            <p className="text-gray-700 whitespace-pre-line mb-6">
              {fund.details}
            </p>

            {/* Progress Section */}
            <div className="mb-6">
              <Progress value={fund.fundedPercent} className="h-2" />
              <div className="flex justify-between text-sm mt-2 text-gray-600">
                <span>{fund.fundedPercent}% Funded</span>
                <span>
                  INR {fund.raised.toLocaleString()} • {fund.contributors}{" "}
                  Contributors
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex space-x-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate(`/contribute/${fund.id}`)}
              >
                Contribute Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/funds")}
              >
                Back to All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContributionDetailPage;
