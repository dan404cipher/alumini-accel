import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FundModalProps, Fund } from "../types";
import { useToast } from "@/hooks/use-toast";

const FundModal: React.FC<FundModalProps> = ({ open, onClose, editData }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "archived" | "suspended",
  });
  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && editData) {
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        status: editData.status || "active",
      });
      setErrors({ name: "", description: "" });
    } else if (open) {
      setFormData({
        name: "",
        description: "",
        status: "active",
      });
      setErrors({ name: "", description: "" });
    }
  }, [open, editData]);

  const validate = (): boolean => {
    const newErrors = { name: "", description: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Fund name is required";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const { fundAPI } = await import("@/lib/api");

      if (editData) {
        await fundAPI.updateFund(editData._id, formData);
        toast({
          title: "Success",
          description: "Fund updated successfully",
        });
      } else {
        await fundAPI.createFund(formData);
        toast({
          title: "Success",
          description: "Fund created successfully",
        });
      }

      onClose();
      window.dispatchEvent(new CustomEvent("fundSaved"));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save fund",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Edit Fund" : "Create New Fund"}
          </DialogTitle>
          <DialogDescription>
            {editData
              ? "Update fund information"
              : "Create a new fund to organize your fundraising campaigns"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Fund Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Library Fund, Scholarship Fund"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the purpose and goals of this fund..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "archived" | "suspended") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Saving..." : editData ? "Update Fund" : "Create Fund"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FundModal;

