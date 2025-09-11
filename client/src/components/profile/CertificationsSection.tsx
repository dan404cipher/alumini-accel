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
  Award,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";
import { CertificationForm } from "@/components/forms/CertificationForm";

interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  credentialUrl?: string;
  credentialFile?: string;
}

interface CertificationsSectionProps {
  certifications: Certification[];
  isEditing: boolean;
  userRole?: string;
  onUpdate: () => void;
}

export const CertificationsSection = ({
  certifications,
  isEditing,
  userRole = "student",
  onUpdate,
}: CertificationsSectionProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] =
    useState<Certification | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const handleDeleteCertification = async (certificationId: string) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${apiUrl}/students/profile/certifications/${certificationId}`,
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
          description: "Certification deleted successfully",
        });
      } else {
        throw new Error("Failed to delete certification");
      }
    } catch (error) {
      console.error("Error deleting certification:", error);
      toast({
        title: "Error",
        description: "Failed to delete certification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCertification = (certification: Certification) => {
    setSelectedCertification(certification);
    setIsEditDialogOpen(true);
  };

  const handleAddCertification = () => {
    setSelectedCertification(null);
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>
              Showcase your professional certifications and achievements
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddCertification}>
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Certification</DialogTitle>
                <DialogDescription>
                  Add details about your certification
                </DialogDescription>
              </DialogHeader>
              <CertificationForm
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
                <DialogTitle>Edit Certification</DialogTitle>
                <DialogDescription>
                  Update details about your certification
                </DialogDescription>
              </DialogHeader>
              <CertificationForm
                certification={selectedCertification}
                userRole={userRole}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCertification(null);
                  onUpdate();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No certifications added yet</p>
            <Button onClick={handleAddCertification}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Certification
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert, index) => (
              <div key={cert._id || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">{cert.name}</h4>
                      <Badge variant="secondary">{cert.issuer}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Issued: {formatDate(cert.date)}</span>
                      </div>

                      {cert.credentialId && (
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          <span>ID: {cert.credentialId}</span>
                        </div>
                      )}
                    </div>

                    {(cert.credentialUrl || cert.credentialFile) && (
                      <div className="mt-3 flex gap-2">
                        {cert.credentialUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(cert.credentialUrl, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Credential URL
                          </Button>
                        )}
                        {cert.credentialFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const apiUrl =
                                import.meta.env.VITE_API_URL ||
                                "http://localhost:3000/api/v1";
                              const baseUrl = apiUrl.replace("/api/v1", "");
                              const fullUrl = `${baseUrl}${cert.credentialFile}`;
                              window.open(fullUrl, "_blank");
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Credential File
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
                        onClick={() => handleEditCertification(cert)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCertification(cert._id!)}
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
