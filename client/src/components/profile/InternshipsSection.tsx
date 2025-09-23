import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import { InternshipForm } from "@/components/forms/InternshipForm";

interface Internship {
  _id?: string;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  location?: string;
  isRemote: boolean;
  stipend?: {
    amount: number;
    currency: string;
  };
  skills: string[];
  certificateFile?: string;
}

interface InternshipsSectionProps {
  internships: Internship[];
  isEditing: boolean;
  userRole?: string;
  onUpdate: () => void;
}

export const InternshipsSection = ({
  internships,
  isEditing,
  userRole = "student",
  onUpdate,
}: InternshipsSectionProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const formatStipend = (stipend: any) => {
    if (!stipend || !stipend.amount) return "Not specified";
    return `${stipend.amount} ${stipend.currency}`;
  };

  const handleDeleteInternship = async (internshipId: string) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${apiUrl}/students/profile/internships/${internshipId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        onUpdate();
        toast({
          title: "Success",
          description: "Internship deleted successfully",
        });
      } else {
        throw new Error("Failed to delete internship");
      }
    } catch (error) {
      console.error("Error deleting internship:", error);
      toast({
        title: "Error",
        description: "Failed to delete internship. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditInternship = (internship: Internship) => {
    setSelectedInternship(internship);
    setIsEditDialogOpen(true);
  };

  const handleAddInternship = () => {
    setSelectedInternship(null);
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Internship Experience</CardTitle>
            <CardDescription>
              Showcase your internship experiences and learnings
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddInternship}>
                <Plus className="w-4 h-4 mr-2" />
                Add Internship
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Internship Experience</DialogTitle>
                <DialogDescription>
                  Add details about your internship experience
                </DialogDescription>
              </DialogHeader>
              <InternshipForm
                userRole={userRole}
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  onUpdate();
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Internship Experience</DialogTitle>
                <DialogDescription>
                  Update details about your internship experience
                </DialogDescription>
              </DialogHeader>
              <InternshipForm
                internship={selectedInternship}
                userRole={userRole}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedInternship(null);
                  onUpdate();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {internships.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No internship experience added yet
            </p>
            <Button onClick={handleAddInternship}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Internship
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {internships.map((internship, index) => (
              <div
                key={internship._id || index}
                className="border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">
                        {internship.position}
                      </h4>
                      <Badge variant="secondary">{internship.company}</Badge>
                      {internship.isOngoing && (
                        <Badge variant="outline" className="text-green-600">
                          Ongoing
                        </Badge>
                      )}
                    </div>

                    {internship.description && (
                      <p className="text-gray-600 mb-3">
                        {internship.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(internship.startDate)}
                          {internship.endDate && !internship.isOngoing
                            ? ` - ${formatDate(internship.endDate)}`
                            : internship.isOngoing
                            ? " - Present"
                            : ""}
                        </span>
                      </div>

                      {internship.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>
                            {internship.location}
                            {internship.isRemote && " (Remote)"}
                          </span>
                        </div>
                      )}

                      {internship.stipend && (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>{formatStipend(internship.stipend)}</span>
                        </div>
                      )}
                    </div>

                    {internship.skills && internship.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {internship.skills.map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {internship.certificateFile && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const apiUrl =
                              import.meta.env.VITE_API_URL ||
                              "http://localhost:3000/api/v1";
                            const baseUrl = apiUrl.replace("/api/v1", "");
                            const fullUrl = `${baseUrl}${internship.certificateFile}`;
                            window.open(fullUrl, "_blank");
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Certificate
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInternship(internship)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInternship(internship._id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
