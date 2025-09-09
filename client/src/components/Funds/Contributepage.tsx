import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ✅ Copy the funds array (or ideally import from a shared file)
const funds = [
  {
    id: 1,
    title: "A Classroom (Hall) Named with Gratitude",
  },
  {
    id: 2,
    title: "Empowering Scholars: Help Fund Their Journey",
  },
  {
    id: 3,
    title: "Rank Holders Endowment Fund",
  },
  {
    id: 4,
    title: "Emergency Medical Fund for Student Parents",
  },
  {
    id: 5,
    title: "Chair Professorship Initiative",
  },
];

const ContributionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const fund = funds.find((f) => f.id === Number(id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ TODO: handle form submit logic here
    alert("Form submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/funds")}
        >
          ← Back to Funds
        </Button>

        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {fund ? fund.title : "Contribution"}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Thank you for choosing to contribute towards this fund.
              <br />
              <span className="font-semibold">For queries contact:</span>
              <br />
              AlumiAccel, 9884848751, 9042648751
              <br />
              feedback.aluminiaccel.ac.in
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount */}
              <div>
                <Label>Amount *</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 font-medium">INR</span>
                  <Input type="number" placeholder="0.00" required />
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input type="text" required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input type="text" required />
                </div>
              </div>

              {/* Email + Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" required />
                </div>
                <div>
                  <Label>Contact Number *</Label>
                  <Input type="tel" required />
                </div>
              </div>

              {/* Course / Degree, Stream, End Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Course / Degree</Label>
                  <Input type="text" />
                </div>
                <div>
                  <Label>Stream</Label>
                  <Input type="text" />
                </div>
                <div>
                  <Label>End Year</Label>
                  <Input type="number" />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Building No. & Street *</Label>
                <Input type="text" required />
              </div>
              <div>
                <Label>Locality *</Label>
                <Input type="text" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input type="text" required />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input type="text" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Country *</Label>
                  <Input type="text" required />
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input type="text" required />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Please Add Instructions / Notes if any</Label>
                <Textarea placeholder="Your message..." />
              </div>

              {/* Transaction Mode */}
              {/* <div>
                <Label>Transaction Mode *</Label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Mode</option>
                  <option value="online">Online</option>
                  {/* <option value="offline">Offline</option> */}
                {/* </select>
              </div> */} 

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-blue-600 text-white">
                Submit Contribution
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContributionPage;
