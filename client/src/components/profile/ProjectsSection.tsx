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
  ExternalLink,
  Github,
  Calendar,
  Users,
  Edit,
  Trash2,
} from "lucide-react";
import { ProjectForm } from "@/components/forms/ProjectForm";

interface Project {
  _id?: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  githubUrl?: string;
  liveUrl?: string;
  teamMembers: Array<{
    name: string;
    role: string;
  }>;
}

interface ProjectsSectionProps {
  projects: Project[];
  isEditing: boolean;
  onUpdate: () => void;
  userRole?: string;
}

export const ProjectsSection = ({
  projects,
  isEditing,
  onUpdate,
  userRole = "student",
}: ProjectsSectionProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleAddProject = () => {
    setSelectedProject(null);
    setIsAddDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const endpoint =
        userRole === "student"
          ? `${apiUrl}/students/profile/projects/${projectId}`
          : `${apiUrl}/alumni/profile/projects/${projectId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        onUpdate();
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Showcase your projects and technical work
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddProject}>
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>
                  Add details about your project
                </DialogDescription>
              </DialogHeader>
              <ProjectForm
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  onUpdate();
                }}
                userRole={userRole}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No projects added yet</p>
            <Button onClick={handleAddProject}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={project._id || index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">
                      {project.title}
                    </h4>
                    <p className="text-gray-600 mb-3">{project.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {formatDate(project.startDate)}
                        {project.endDate && !project.isOngoing
                          ? ` - ${formatDate(project.endDate)}`
                          : project.isOngoing
                          ? " - Ongoing"
                          : ""}
                      </span>
                    </div>

                    {project.teamMembers.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Users className="w-4 h-4 mr-1" />
                        <span>
                          Team:{" "}
                          {project.teamMembers
                            .map((member) => member.name)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {project.githubUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(project.githubUrl, "_blank")
                          }
                        >
                          <Github className="w-4 h-4 mr-1" />
                          Code
                        </Button>
                      )}
                      {project.liveUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.liveUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Live Demo
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          project._id && handleDeleteProject(project._id)
                        }
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

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update your project details</DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <ProjectForm
                project={selectedProject}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setSelectedProject(null);
                  onUpdate();
                }}
                userRole={userRole}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
