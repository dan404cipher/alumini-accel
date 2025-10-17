import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { userAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

const ExportAlumniData = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has permission to export
  const canExport =
    user?.role &&
    ["super_admin", "college_admin", "hod", "staff"].includes(user.role);

  const handleExport = async (format: "excel" | "csv") => {
    setIsExporting(true);
    try {
      await userAPI.exportAlumniData(format);

      toast({
        title: "Export Successful",
        description: `Alumni data exported as ${format.toUpperCase()} file`,
      });
    } catch (error: any) {
      let errorMessage = "Failed to export alumni data. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to export alumni data.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Don't show export button if user doesn't have permission
  if (!canExport) {
    return (
      <Button variant="outline" disabled>
        <Download className="w-4 h-4 mr-2" />
        Export Alumni Data (No Permission)
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export Alumni Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportAlumniData;
