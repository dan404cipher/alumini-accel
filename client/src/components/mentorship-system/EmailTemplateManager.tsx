import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TEMPLATE_TYPES = [
  { value: "mentor_invitation", label: "Mentor Invitation" },
  { value: "mentee_invitation", label: "Mentee Invitation" },
  { value: "registration_acknowledgement", label: "Registration Acknowledgement" },
  { value: "welcome_mentee", label: "Welcome Mentee" },
  { value: "mentor_match_request", label: "Mentor Match Request" },
  { value: "rejection_notification", label: "Rejection Notification" },
  { value: "approval_notification", label: "Approval Notification" },
];

const AVAILABLE_VARIABLES = [
  "{{programName}}",
  "{{programCategory}}",
  "{{mentorName}}",
  "{{menteeName}}",
  "{{registrationLink}}",
  "{{mentorSelectionLink}}",
  "{{studentID}}",
  "{{rejectionReason}}",
  "{{approvalMessage}}",
  "{{coordinatorName}}",
  "{{programManagerName}}",
  "{{registrationDeadline}}",
  "{{mentorRegistrationDeadline}}",
  "{{menteeRegistrationDeadline}}",
  "{{matchingEndDate}}",
  "{{preferredName}}",
  "{{firstName}}",
  "{{lastName}}",
  "{{personalEmail}}",
  "{{sitEmail}}",
  "{{classOf}}",
];

export const EmailTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    templateType: "",
    subject: "",
    body: "",
    isActive: true,
  });

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [typeFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.templateType = typeFilter;
      const response = await api.get("/email-templates", { params });
      if (response.data.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      templateType: "",
      subject: "",
      body: "",
      isActive: true,
    });
    setSelectedTemplate(null);
    setShowCreateModal(true);
  };

  const handleEdit = (template: any) => {
    setFormData({
      name: template.name,
      templateType: template.templateType,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.templateType || !formData.subject || !formData.body) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedTemplate) {
        await api.put(`/email-templates/${selectedTemplate._id}`, formData);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await api.post("/email-templates", formData);
        toast({ title: "Success", description: "Template created successfully" });
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await api.delete(`/email-templates/${id}`);
      toast({ title: "Success", description: "Template deleted successfully" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (template: any) => {
    try {
      const response = await api.post(`/email-templates/${template._id}/preview`);
      if (response.data.success) {
        setPreview(response.data.data);
        setSelectedTemplate(template);
        setShowPreviewModal(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to preview template",
        variant: "destructive",
      });
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData({ ...formData, body: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Template Management
          </h1>
          <p className="text-gray-600">Create and manage email templates for mentoring programs</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Type
        </label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {TEMPLATE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-lg shadow border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {TEMPLATE_TYPES.find((t) => t.value === template.templateType)?.label}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {template.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {template.subject}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template._id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {selectedTemplate ? "Edit Template" : "Create Template"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.templateType}
                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    {TEMPLATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Variables
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded border">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        onClick={() => insertVariable(variable)}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body (HTML) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="email-body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Enter HTML email body. Use {{variable}} for dynamic content."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Template Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <strong>Subject:</strong> {preview.subject}
              </div>
              <div
                className="border border-gray-300 rounded p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: preview.body }}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

