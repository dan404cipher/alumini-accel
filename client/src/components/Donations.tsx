import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, DollarSign, Users, Target, Calendar } from "lucide-react";

const Donations = () => {
  const [donations] = useState([
    {
      id: "1",
      title: "Scholarship Fund for Underprivileged Students",
      description:
        "Help provide financial assistance to deserving students who need support to continue their education.",
      targetAmount: 50000,
      currentAmount: 32500,
      donors: 127,
      deadline: "2024-12-31",
      category: "Education",
      status: "active",
    },
    {
      id: "2",
      title: "Library Modernization Project",
      description:
        "Upgrade our college library with modern books, digital resources, and improved facilities.",
      targetAmount: 75000,
      currentAmount: 45000,
      donors: 89,
      deadline: "2024-11-30",
      category: "Infrastructure",
      status: "active",
    },
    {
      id: "3",
      title: "Sports Equipment Fund",
      description:
        "Support our sports teams by providing new equipment and facilities for various sports activities.",
      targetAmount: 30000,
      currentAmount: 30000,
      donors: 156,
      deadline: "2024-10-15",
      category: "Sports",
      status: "completed",
    },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donations</h1>
          <p className="text-muted-foreground">
            Support our college community through meaningful contributions
          </p>
        </div>
        <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
          <Heart className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Raised
                </p>
                <p className="text-2xl font-bold">$107,500</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Donors
                </p>
                <p className="text-2xl font-bold">372</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Campaigns
                </p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation Campaigns */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Active Campaigns</h2>
        <div className="grid gap-6">
          {donations.map((donation) => (
            <Card
              key={donation.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {donation.title}
                    </CardTitle>
                    <p className="text-gray-600 mb-4">{donation.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Deadline: {formatDate(donation.deadline)}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {donation.donors} donors
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      donation.status === "active" ? "default" : "secondary"
                    }
                    className="ml-4"
                  >
                    {donation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {formatCurrency(donation.currentAmount)}
                      </span>
                      <span className="text-gray-500">
                        of {formatCurrency(donation.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${getProgressPercentage(
                            donation.currentAmount,
                            donation.targetAmount
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {getProgressPercentage(
                        donation.currentAmount,
                        donation.targetAmount
                      ).toFixed(1)}
                      % funded
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Share Campaign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Donations;
