import React, { useState } from "react";
import {
  Send,
  Paperclip,
  X,
  Save,
  File,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EmailComposerProps {
  communityId: string;
  recipientId: string;
  recipientName: string;
  recipientType: "mentor" | "mentee";
  replyToId?: string;
  onSent?: () => void;
  onCancel?: () => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  communityId,
  recipientId,
  recipientName,
  recipientType,
  replyToId,
  onSent,
  onCancel,
}) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and body are required",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("communityId", communityId);
      if (recipientType === "mentee") {
        formData.append("menteeId", recipientId);
      } else {
        formData.append("mentorId", recipientId);
      }
      formData.append("subject", subject);
      formData.append("body", body);
      if (replyToId) {
        formData.append("replyToId", replyToId);
      }

      attachments.forEach((file, index) => {
        formData.append("attachments", file);
      });

      const endpoint =
        recipientType === "mentee"
          ? "/mentorship-communications/send"
          : "/mentorship-communications/send-to-mentor";

      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Email sent successfully",
        });
        setSubject("");
        setBody("");
        setAttachments([]);
        if (onSent) {
          onSent();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Compose Email
        </h3>
        <p className="text-sm text-gray-600">
          To: {recipientName} ({recipientType === "mentor" ? "Mentor" : "Mentee"})
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message..."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center">
                    <File className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <label className="flex items-center cursor-pointer">
              <Paperclip className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Attach Files</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex space-x-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

