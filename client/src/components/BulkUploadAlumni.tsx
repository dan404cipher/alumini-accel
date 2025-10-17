import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { userAPI } from "@/lib/api";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

interface BulkUploadResult {
  successful: Array<{
    row: number;
    email: string;
    name: string;
    password: string;
  }>;
  failed: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  total: number;
}

const BulkUploadAlumni = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Template data for download
  const templateData = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "password123",
      department: "Computer Science",
      graduationYear: 2020,
      currentCompany: "Tech Corp",
      currentPosition: "Software Engineer",
      phoneNumber: "+1234567890",
      address: "123 Main St, City, State",
      bio: "Passionate about technology and innovation",
      linkedinProfile: "https://linkedin.com/in/johndoe",
      twitterHandle: "@johndoe",
      githubProfile: "https://github.com/johndoe",
      website: "https://johndoe.com",
      dateOfBirth: "1995-01-01",
      gender: "male",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      password: "password456",
      department: "Business Administration",
      graduationYear: 2019,
      currentCompany: "Business Inc",
      currentPosition: "Marketing Manager",
      phoneNumber: "+0987654321",
      address: "456 Oak Ave, City, State",
      bio: "Marketing professional with 5+ years experience",
      linkedinProfile: "https://linkedin.com/in/janesmith",
      twitterHandle: "@janesmith",
      githubProfile: "",
      website: "https://janesmith.com",
      dateOfBirth: "1994-05-15",
      gender: "female",
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    parseFile(file);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required columns
        const requiredColumns = ["firstName", "lastName", "email"];
        const firstRow = jsonData[0] as any;
        const missingColumns = requiredColumns.filter(
          (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Please include these columns: ${missingColumns.join(
              ", "
            )}`,
            variant: "destructive",
          });
          return;
        }

        setParsedData(jsonData);
        toast({
          title: "File parsed successfully",
          description: `Found ${jsonData.length} records`,
        });
      } catch (error) {
        toast({
          title: "Error parsing file",
          description: "Please check the file format and try again",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkUpload = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No data to upload",
        description: "Please upload a file with alumni data first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await userAPI.bulkCreateAlumni(parsedData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadResult(response.data);
        setActiveTab("results");
        toast({
          title: "Bulk upload completed",
          description: `${response.data.successful.length} alumni created successfully`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: response.message || "Failed to create alumni",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message || "Failed to upload alumni data",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumni Template");
    XLSX.writeFile(wb, "alumni_template.xlsx");
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setParsedData([]);
    setUploadResult(null);
    setUploadProgress(0);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload Alumni
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Alumni</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="preview">Preview Data</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Upload Alumni Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Excel/CSV File</Label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>

                  {parsedData.length > 0 && (
                    <Button
                      onClick={handleBulkUpload}
                      disabled={isUploading}
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Alumni"}
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading alumni...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required fields:</strong> firstName, lastName, email
                <br />
                <strong>Optional fields:</strong> password, department,
                graduationYear, currentCompany, currentPosition, phoneNumber,
                address, bio, linkedinProfile, twitterHandle, githubProfile,
                website, dateOfBirth, gender
                <br />
                <strong>Note:</strong> If password is not provided, a random
                password will be generated for each user.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {parsedData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Data Preview ({parsedData.length} records)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">First Name</th>
                          <th className="text-left p-2">Last Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Department</th>
                          <th className="text-left p-2">Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 10).map((row: any, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{row.firstName || "-"}</td>
                            <td className="p-2">{row.lastName || "-"}</td>
                            <td className="p-2">{row.email || "-"}</td>
                            <td className="p-2">{row.department || "-"}</td>
                            <td className="p-2">{row.currentCompany || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing first 10 records of {parsedData.length} total
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data to preview. Please upload a file first.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {uploadResult && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Upload Results</span>
                      <div className="flex space-x-2">
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {uploadResult.successful.length} Successful
                        </Badge>
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {uploadResult.failed.length} Failed
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadResult.successful.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">
                          Successfully Created:
                        </h4>
                        <div className="max-h-40 overflow-y-auto">
                          {uploadResult.successful.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-green-50 rounded mb-1"
                            >
                              <span className="text-sm">
                                Row {item.row}: {item.name} ({item.email})
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {item.password}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadResult.failed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">
                          Failed to Create:
                        </h4>
                        <div className="max-h-40 overflow-y-auto">
                          {uploadResult.failed.map((item, index) => (
                            <div
                              key={index}
                              className="p-2 bg-red-50 rounded mb-1"
                            >
                              <div className="text-sm font-medium">
                                Row {item.row}: {item.email}
                              </div>
                              <div className="text-xs text-red-600">
                                {item.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetUpload}>
                    Upload Another File
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadAlumni;
