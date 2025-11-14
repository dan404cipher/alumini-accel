import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { userAPI } from "@/lib/api";
import { GraduationCap, ArrowUp, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EligibleStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: number;
  department?: string;
  profilePicture?: string;
  status: string;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const EligibleStudentsPanel = () => {
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const { toast } = useToast();

  const fetchEligibleStudents = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getEligibleStudents({
        page,
        limit: 10,
      });

      if (response.success && response.data) {
        setStudents(response.data.students || []);
        setPagination(response.data.pagination || pagination);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch eligible students",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching eligible students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch eligible students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleStudents();
  }, [page]);

  const handlePromote = async (studentId: string) => {
    try {
      setPromoting(studentId);
      const response = await userAPI.promoteStudentToAlumni(studentId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Student promoted to alumni successfully",
        });
        // Remove promoted student from list
        setStudents(students.filter((s) => s._id !== studentId));
        setPagination({
          ...pagination,
          totalCount: pagination.totalCount - 1,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to promote student",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error promoting student:", error);
      toast({
        title: "Error",
        description: "Failed to promote student to alumni",
        variant: "destructive",
      });
    } finally {
      setPromoting(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Eligible Students for Alumni Promotion
          </CardTitle>
          <CardDescription>
            Students who have graduated and are eligible to be promoted to alumni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Eligible Students for Alumni Promotion
            </CardTitle>
            <CardDescription className="mt-1">
              Students who have graduated and are eligible to be promoted to
              alumni ({pagination.totalCount} eligible)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEligibleStudents}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No eligible students found.</p>
            <p className="text-sm mt-2">
              Students become eligible when their graduation year is less than or
              equal to the current year.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Graduation Year</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={student.profilePicture}
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                            <AvatarFallback>
                              {getInitials(student.firstName, student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.graduationYear}</Badge>
                      </TableCell>
                      <TableCell>
                        {student.department || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "active"
                              ? "default"
                              : student.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handlePromote(student._id)}
                          disabled={promoting === student._id}
                          className="gap-2"
                        >
                          {promoting === student._id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Promoting...
                            </>
                          ) : (
                            <>
                              <ArrowUp className="w-4 h-4" />
                              Promote to Alumni
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EligibleStudentsPanel;

