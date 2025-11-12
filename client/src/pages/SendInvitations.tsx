import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SendInvitations } from "@/components/mentorship-system/SendInvitations";

export const SendInvitationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const programId = searchParams.get("programId") || "";

  if (!programId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Program ID Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please provide a program ID to send invitations.
          </p>
          <Button onClick={() => navigate("/mentoring-programs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Send Invitations</h1>
          <p className="text-gray-600 mt-2">
            Send mentor and mentee invitations for the program
          </p>
        </div>
        <SendInvitations programId={programId} />
      </div>
    </div>
  );
};

export default SendInvitationsPage;

