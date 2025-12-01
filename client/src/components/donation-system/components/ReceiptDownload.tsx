import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { donationApi } from "@/services/donationApi";
import { useToast } from "@/hooks/use-toast";

interface ReceiptDownloadProps {
  donationId: string;
  receiptId?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const ReceiptDownload: React.FC<ReceiptDownloadProps> = ({
  donationId,
  receiptId,
  disabled = false,
  variant = "outline",
  size = "sm",
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!donationId) {
      toast({
        title: "Error",
        description: "Donation ID is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const blob = await donationApi.downloadReceipt(donationId);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptId || donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download Receipt
        </>
      )}
    </Button>
  );
};

export default ReceiptDownload;

