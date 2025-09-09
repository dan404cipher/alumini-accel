import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface Fund {
  id: number;
  title: string;
  description: string;
  raised: number;
  contributors: number;
  fundedPercent: number;
}

const funds: Fund[] = [
  {
    id: 1,
    title: "A Classroom (Hall) Named with Gratitude",
    description:
      "Honor your loved ones by dedicating a classroom or hall, as a lasting tribute to your support for education.",
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 2,
    title: "Empowering Scholars: Help Fund Their Journey",
    description:
      "Support scholars with travel grants to attend conferences, share research, and collaborate globally.",
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 3,
    title: "Rank Holders Endowment Fund",
    description:
      "Reward and support exceptional students, enabling them to pursue academic excellence without barriers.",
    raised: 450000,
    contributors: 1,
    fundedPercent: 45,
  },
  {
    id: 4,
    title: "Emergency Medical Fund for Student Parents",
    description:
      "Provide urgent medical support to student parents during crises, ensuring they continue education.",
    raised: 0,
    contributors: 0,
    fundedPercent: 0,
  },
  {
    id: 5,
    title: "Chair Professorship Initiative",
    description:
      "Support endowed chair professorships to attract top scholars, foster research, and elevate education.",
    raised: 0,
    contributors: 1,
    fundedPercent: 0,
  },
];

const FundsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContribute = (id: number) => {
    navigate(`/contribute/${id}`);
  };
  const Contributedetail =(id: number)=>{
    navigate(`/Contributedetail/${id}`);
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">
          Fundraising Campaigns
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => (
            <Card
              key={fund.id}
              className="shadow-md hover:shadow-lg transition rounded-2xl flex flex-col"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {fund.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-full">
                <p className="text-sm text-gray-600 mb-4">{fund.description} 
                    <span className="text-blue-600 cursor-pointer"
                 onClick={() => navigate(`/contributedetails/${fund.id}`)}>Read More</span></p>
                {/* <p className="text-sm text-blue-600 mb-4 " >Read More</p> */}

                <div className="mb-3">
                  <Progress value={fund.fundedPercent} className="h-2" />
                  <div className="flex justify-between text-xs mt-1 text-gray-600">
                    <span>{fund.fundedPercent}% Funded</span>
                    <span>
                      INR {fund.raised.toLocaleString()} • {fund.contributors}{" "}
                      contributors
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleContribute(fund.id)}
                  className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Contribute
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundsPage;
