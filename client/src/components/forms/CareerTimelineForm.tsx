import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Edit, Trash2, Calendar, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const careerTimelineSchema = z.object({
  position: z.string().min(1, "Position is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  description: z.string().optional(),
  location: z.string().optional(),
});

type CareerTimelineFormData = z.infer<typeof careerTimelineSchema>;

interface CareerTimelineItem {
  _id?: string;
  position: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  location?: string;
}

interface CareerTimelineFormProps {
  careerTimeline: CareerTimelineItem[];
  onUpdate: () => void;
}

export const CareerTimelineForm = ({
  careerTimeline,
  onUpdate,
}: CareerTimelineFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CareerTimelineItem | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CareerTimelineFormData>({
    resolver: zodResolver(careerTimelineSchema),
    defaultValues: {
      position: "",
      company: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      location: "",
    },
  });

  const isCurrent = watch("isCurrent");

  const handleAdd = () => {
    reset();
    setSelectedItem(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: CareerTimelineItem) => {
    setSelectedItem(item);
    reset({
      position: item.position,
      company: item.company,
      startDate: item.startDate.split("T")[0],
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      isCurrent: item.isCurrent,
      description: item.description || "",
      location: item.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (item: CareerTimelineItem) => {
    if (!item._id) return;

    try {
      setIsLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

      const response = await fetch(
        `${apiUrl}/alumni/profile/career-timeline/${item._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      onUpdate();
      toast({
        title: "Success",
        description: "Career timeline item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting career timeline item:", error);
      toast({
        title: "Error",
        description: "Failed to delete career timeline item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CareerTimelineFormData) => {
    try {
      setIsLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

      const url = selectedItem?._id
        ? `${apiUrl}/alumni/profile/career-timeline/${selectedItem._id}`
        : `${apiUrl}/alumni/profile/career-timeline`;

      const method = selectedItem?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          endDate: data.endDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        onUpdate();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        reset();
        toast({
          title: "Success",
          description: selectedItem?._id
            ? "Career timeline item updated successfully"
            : "Career timeline item added successfully",
        });
      } else {
        throw new Error(
          result.message || "Failed to save career timeline item"
        );
      }
    } catch (error) {
      console.error("Error saving career timeline item:", error);
      toast({
        title: "Error",
        description: "Failed to save career timeline item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Career Timeline</CardTitle>
            <CardDescription>
              Your professional journey and work history
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {careerTimeline.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No career timeline added yet</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Experience
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {careerTimeline.map((item, index) => (
              <div
                key={item._id || index}
                className="border-l-4 border-blue-200 pl-4 py-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{item.position}</h4>
                    <p className="text-gray-600 font-medium">{item.company}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(item.startDate).toLocaleDateString()} -
                          {item.isCurrent && !item.endDate
                            ? " Present"
                            : item.endDate
                            ? new Date(item.endDate).toLocaleDateString()
                            : " Present"}
                        </span>
                      </div>
                      {item.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {item.isCurrent && !item.endDate && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Current
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem
                ? "Edit Career Timeline Item"
                : "Add Career Timeline Item"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? "Update your career timeline information"
                : "Add a new career timeline entry"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="position"
                    {...register("position")}
                    placeholder="e.g., Software Engineer"
                    className="pl-10"
                  />
                </div>
                {errors.position && (
                  <p className="text-sm text-red-600">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  {...register("company")}
                  placeholder="e.g., Google"
                />
                {errors.company && (
                  <p className="text-sm text-red-600">
                    {errors.company.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g., San Francisco, CA"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isCurrent" {...register("isCurrent")} />
              <Label htmlFor="isCurrent">This is my current position</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your role and achievements..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedItem(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : selectedItem
                  ? "Update Experience"
                  : "Add Experience"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
