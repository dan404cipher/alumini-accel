import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload } from "lucide-react";

interface DocumentsSectionProps {
  documents: any[];
  loading?: boolean;
}

export const DocumentsSection = ({ documents, loading }: DocumentsSectionProps) => {
  // This is a placeholder - documents would come from alumni profile
  // You can extend this to show certificates, transcripts, etc.

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No documents available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name || "Document"}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type || "Unknown type"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

