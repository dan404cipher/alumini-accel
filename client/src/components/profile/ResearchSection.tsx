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
import { getAuthTokenOrNull } from "@/utils/auth";
import {
  Plus,
  BookOpen,
  User,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import { ResearchForm } from "@/components/forms/ResearchForm";

interface Research {
  _id?: string;
  title: string;
  description: string;
  supervisor?: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  publicationUrl?: string;
  conferenceUrl?: string;
  keywords: string[];
  status: "ongoing" | "completed" | "published" | "presented";
  publicationFile?: string;
  conferenceFile?: string;
}

interface ResearchSectionProps {
  research: Research[];
  isEditing: boolean;
  userRole?: string;
  onUpdate: () => void;
}

export const ResearchSection = ({
  research,
  isEditing,
  userRole = "student",
  onUpdate,
}: ResearchSectionProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(
    null
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const handleDeleteResearch = async (researchId: string) => {
    try {
      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${apiUrl}/students/profile/research/${researchId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        onUpdate();
        toast({
          title: "Success",
          description: "Research work deleted successfully",
        });
      } else {
        throw new Error("Failed to delete research work");
      }
    } catch (error) {
      console.error("Error deleting research work:", error);
      toast({
        title: "Error",
        description: "Failed to delete research work. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditResearch = (researchItem: Research) => {
    setSelectedResearch(researchItem);
    setIsEditDialogOpen(true);
  };

  const handleAddResearch = () => {
    setSelectedResearch(null);
    setIsAddDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "published":
        return "bg-purple-100 text-purple-800";
      case "presented":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Research Work</CardTitle>
            <CardDescription>
              Showcase your research projects and academic work
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddResearch}>
                <Plus className="w-4 h-4 mr-2" />
                Add Research
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Research Work</DialogTitle>
                <DialogDescription>
                  Add details about your research project
                </DialogDescription>
              </DialogHeader>
              <ResearchForm
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
                <DialogTitle>Edit Research Work</DialogTitle>
                <DialogDescription>
                  Update details about your research project
                </DialogDescription>
              </DialogHeader>
              <ResearchForm
                research={selectedResearch}
                userRole={userRole}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedResearch(null);
                  onUpdate();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {research.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No research work added yet</p>
            <Button onClick={handleAddResearch}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Research
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {research.map((item, index) => (
              <div key={item._id || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </Badge>
                      {item.isOngoing && (
                        <Badge variant="outline" className="text-blue-600">
                          Ongoing
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{item.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(item.startDate)}
                          {item.endDate && !item.isOngoing
                            ? ` - ${formatDate(item.endDate)}`
                            : item.isOngoing
                            ? " - Present"
                            : ""}
                        </span>
                      </div>

                      {item.supervisor && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>Supervisor: {item.supervisor}</span>
                        </div>
                      )}
                    </div>

                    {(item.publicationUrl || item.publicationFile) && (
                      <div className="mt-3 flex gap-2">
                        {item.publicationUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(item.publicationUrl, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Publication URL
                          </Button>
                        )}
                        {item.publicationFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const apiUrl =
                                import.meta.env.VITE_API_BASE_URL ||
                                "http://localhost:3000/api/v1";
                              const baseUrl = apiUrl.replace("/api/v1", "");
                              const fullUrl = `${baseUrl}${item.publicationFile}`;
                              window.open(fullUrl, "_blank");
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Publication File
                          </Button>
                        )}
                      </div>
                    )}

                    {(item.conferenceUrl || item.conferenceFile) && (
                      <div className="mt-2 flex gap-2">
                        {item.conferenceUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(item.conferenceUrl, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Conference URL
                          </Button>
                        )}
                        {item.conferenceFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const apiUrl =
                                import.meta.env.VITE_API_BASE_URL ||
                                "http://localhost:3000/api/v1";
                              const baseUrl = apiUrl.replace("/api/v1", "");
                              const fullUrl = `${baseUrl}${item.conferenceFile}`;
                              window.open(fullUrl, "_blank");
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Conference File
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditResearch(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResearch(item._id!)}
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
