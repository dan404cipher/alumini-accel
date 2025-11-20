import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAuthTokenOrNull } from "@/utils/auth";

import { API_BASE_URL } from "@/lib/api";
const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  credentialId: z.string().optional(),
  credentialFile: z.any().optional(),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  certification?: any;
  userRole?: string;
  onSuccess: () => void;
}

export const CertificationForm = ({
  certification,
  userRole = "student",
  onSuccess,
}: CertificationFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentialFile, setCredentialFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: certification?.name || "",
      issuer: certification?.issuer || "",
      date: certification?.date ? certification.date.split("T")[0] : "",
      credentialId: certification?.credentialId || "",
      credentialFile: undefined,
    },
  });

  const onSubmit = async (data: CertificationFormData) => {
    try {
      setIsLoading(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl =
        API_BASE_URL;
      const baseEndpoint =
        userRole === "student"
          ? `${apiUrl}/students/profile/certifications`
          : `${apiUrl}/alumni/profile/certifications`;
      const url = certification?._id
        ? `${baseEndpoint}/${certification._id}`
        : baseEndpoint;

      const method = certification?._id ? "PUT" : "POST";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("issuer", data.issuer);
      formData.append("date", data.date);
      if (data.credentialId) formData.append("credentialId", data.credentialId);
      if (credentialFile) {
        formData.append("credentialFile", credentialFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        onSuccess();
        toast({
          title: "Success",
          description: certification?._id
            ? "Certification updated successfully"
            : "Certification added successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save certification");
      }
    } catch (error) {
      console.error("Error saving certification:", error);
      toast({
        title: "Error",
        description: "Failed to save certification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Certification Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter certification name"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="issuer">Issuing Organization *</Label>
        <Input
          id="issuer"
          {...register("issuer")}
          placeholder="Enter issuing organization"
        />
        {errors.issuer && (
          <p className="text-sm text-red-600">{errors.issuer.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Issue Date *</Label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && (
          <p className="text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="credentialId">Credential ID</Label>
        <Input
          id="credentialId"
          {...register("credentialId")}
          placeholder="Enter credential ID"
        />
        {errors.credentialId && (
          <p className="text-sm text-red-600">{errors.credentialId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="credentialFile">Credential File (PDF/DOC)</Label>
        <Input
          id="credentialFile"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ];
              if (allowedTypes.includes(file.type)) {
                setCredentialFile(file);
              } else {
                toast({
                  title: "Invalid file type",
                  description: "Please upload a PDF or DOC file",
                  variant: "destructive",
                });
              }
            }
          }}
        />
        {credentialFile && (
          <p className="text-sm text-green-600">
            Selected: {credentialFile.name}
          </p>
        )}
        {errors.credentialFile && (
          <p className="text-sm text-red-600">
            {errors.credentialFile.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : certification?._id ? "Update" : "Add"}{" "}
          Certification
        </Button>
      </div>
    </form>
  );
};
