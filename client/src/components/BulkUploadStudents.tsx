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

const BulkUploadStudents = () => {
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
      password: "Student@123",
      department: "Computer Science",
      currentYear: 2,
      currentCGPA: 3.8,
      graduationYear: 2025,
      phoneNumber: "+1234567890",
      address: "123 Main St, City, State",
      dateOfBirth: "2003-01-01",
      gender: "male",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      password: "Student@123",
      department: "Business Administration",
      currentYear: 3,
      currentCGPA: 3.9,
      graduationYear: 2024,
      phoneNumber: "+0987654321",
      address: "456 Oak Ave, City, State",
      dateOfBirth: "2002-05-15",
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
        const requiredColumns = ["firstName", "lastName", "email", "department"];
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
        description: "Please upload a file with student data first",
        variant: "destructive",
      });
      return;
    }

    if (parsedData.length > 1000) {
      toast({
        title: "Too many records",
        description: "Cannot upload more than 1000 students at once. Please split your file into smaller batches.",
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

      const response = await userAPI.bulkCreateStudents(parsedData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        setUploadResult(response.data as BulkUploadResult);
        setActiveTab("results");
        const resultData = response.data as BulkUploadResult;
        toast({
          title: "Bulk upload completed",
          description: `${resultData.successful.length} students created successfully`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: response.message || "Failed to create students",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message || "Failed to upload student data",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "students_template.xlsx");
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
          Bulk Upload Students
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Students</DialogTitle>
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
                  Upload Student Data
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
                      disabled={isUploading || parsedData.length > 1000}
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Students"}
                    </Button>
                  )}
                  {parsedData.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {parsedData.length} records ready to upload
                      {parsedData.length > 1000 && (
                        <span className="text-red-500 ml-2">
                          (Maximum 1000 allowed)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading students...</span>
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
                <strong>Required fields:</strong> firstName, lastName, email, department
                <br />
                <strong>Optional fields:</strong> password, currentYear, currentCGPA, 
                graduationYear, phoneNumber, address, dateOfBirth, gender
                <br />
                <strong>Note:</strong> If password is not provided, default password 
                "Student@123" will be assigned to each student.
                <br />
                <strong>Limit:</strong> Maximum 1000 students per upload.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {parsedData.length > 0 ? (
              <>
                {parsedData.length > 1000 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Too many records:</strong> You have {parsedData.length} records, but the maximum allowed is 1000. Please split your file into smaller batches.
                    </AlertDescription>
                  </Alert>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Data Preview ({parsedData.length} records)
                      {parsedData.length > 1000 && (
                        <Badge variant="destructive" className="ml-2">
                          Exceeds limit
                        </Badge>
                      )}
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
                            <th className="text-left p-2">Year</th>
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
                              <td className="p-2">{row.currentYear || "-"}</td>
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
              </>
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

export default BulkUploadStudents;
