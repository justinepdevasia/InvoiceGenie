'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FolderOpen,
  Image,
  FileCheck
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface FileWithPreview {
  file: File; // Store the original File object
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  name: string;
  size: number;
  type: string;
}

interface Project {
  id: string;
  name: string;
}

function UploadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
    const projectId = searchParams.get('project');
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [searchParams]);

  async function fetchProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => ({
      file: file, // Store the original File object
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    if (rejectedFiles.length > 0) {
      alert('Some files were rejected. Please ensure files are PDFs or images under 10MB.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(files => files.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    if (files.length === 0) {
      alert('Please add files to upload');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const fileWrapper of files) {
        try {
          setFiles(prev => prev.map(f => 
            f.id === fileWrapper.id 
              ? { ...f, status: 'uploading', progress: 30 }
              : f
          ));

          // Upload to storage for preview, but use direct base64 for OCR
          console.log('Original file:', fileWrapper.file);
          console.log('File size:', fileWrapper.size);
          console.log('File type:', fileWrapper.type);
          
          const fileName = `${user.id}/${selectedProject}/${Date.now()}-${fileWrapper.name}`;
          
          // Upload to Supabase storage (fallback to regular API for reliability)
          let filePath = fileName;
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, fileWrapper.file, {
                contentType: fileWrapper.type || 'application/pdf',
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Storage upload failed:', uploadError);
              throw new Error(`Storage upload failed: ${uploadError.message}`);
            }

            filePath = uploadData.path;
            console.log('File uploaded successfully to:', filePath);
          } catch (storageErr) {
            console.error('Storage upload error:', storageErr);
            throw new Error(`Failed to upload file: ${storageErr instanceof Error ? storageErr.message : 'Unknown error'}`);
          }

          setFiles(prev => prev.map(f => 
            f.id === fileWrapper.id 
              ? { ...f, status: 'uploading', progress: 60 }
              : f
          ));

          // Create invoice record
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert([{
              project_id: selectedProject,
              user_id: user.id,
              file_path: filePath,
              original_file_name: fileWrapper.name,
              file_type: fileWrapper.type || 'application/octet-stream',
              file_size: fileWrapper.size,
              processing_status: 'pending'
            }])
            .select()
            .single();

          if (invoiceError) throw invoiceError;

          setFiles(prev => prev.map(f => 
            f.id === fileWrapper.id 
              ? { ...f, status: 'processing', progress: 80 }
              : f
          ));

          // Convert file to base64 and send directly to OCR
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1]; // Remove data URL prefix
              resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(fileWrapper.file);
          });
          
          console.log('Sending to OCR - File size:', fileWrapper.size);
          console.log('Sending to OCR - Base64 length:', base64Data.length);
          
          const ocrResponse = await fetch('/api/ocr/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              invoiceId: invoiceData.id,
              base64Data: base64Data, // Send base64 data directly
              fileType: fileWrapper.type || 'application/octet-stream',
              fileName: fileWrapper.name
            })
          });

          // Log response for debugging
          const responseText = await ocrResponse.text();
          console.log('OCR Response Status:', ocrResponse.status);
          console.log('OCR Response:', responseText);

          if (ocrResponse.ok) {
            try {
              JSON.parse(responseText); // Validate response is valid JSON
            } catch (e) {
              console.error('Failed to parse OCR response:', responseText);
              throw new Error('Invalid OCR response');
            }
            
            setFiles(prev => prev.map(f => 
              f.id === fileWrapper.id 
                ? { ...f, status: 'completed', progress: 100 }
                : f
            ));
          } else {
            let errorMessage = 'OCR processing failed';
            let userMessage = errorMessage;
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.details || errorMessage;
              userMessage = errorData.message || errorMessage;
            } catch (e) {
              // If response is not JSON, use the text
              errorMessage = responseText || errorMessage;
              userMessage = errorMessage;
            }
            console.error('OCR processing failed:', errorMessage);
            
            // Update file with error message
            setFiles(prev => prev.map(f => 
              f.id === fileWrapper.id 
                ? { ...f, status: 'failed', error: userMessage }
                : f
            ));
            
            // Don't throw for PDF errors, just mark as failed
            if (userMessage.includes('PDF')) {
              continue; // Move to next file
            }
            throw new Error(userMessage);
          }

        } catch (error) {
          console.error(`Error uploading ${fileWrapper.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === fileWrapper.id 
              ? { ...f, status: 'failed', error: 'Upload failed' }
              : f
          ));
        }
      }

      setUploadComplete(true);
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type && file.type.startsWith('image/')) {
      return <Image className="h-8 w-8" />;
    }
    return <FileText className="h-8 w-8" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />;
      default:
        return <FileCheck className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload expense documents (invoices, receipts, bills, statements) for AI-powered OCR processing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose which project these expense documents belong to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedProject ? projects.find(p => p.id === selectedProject)?.name || 'Select a project' : 'Select a project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/projects')}
            >
              Manage Projects
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg font-semibold">Drop files here...</p>
            ) : (
              <>
                <p className="text-lg font-semibold mb-2">
                  Drag & drop files here
                </p>
                <p className="text-muted-foreground">
                  or click to browse files
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports PDF, PNG, JPG, JPEG, GIF, WebP (Max 10MB per file)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Files ({files.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={uploadFiles}
                  disabled={isUploading || !selectedProject}
                >
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Processing...'}
                      </p>
                      {file.status === 'uploading' || file.status === 'processing' ? (
                        <Progress value={file.progress} className="h-1 mt-2" />
                      ) : file.error ? (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      ) : null}
                    </div>
                    {getStatusIcon(file.status)}
                    {file.status === 'pending' && !isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uploadComplete && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Files uploaded successfully! They are now being processed.
            <Button
              variant="link"
              className="ml-2"
              onClick={() => router.push(`/dashboard/projects/${selectedProject}`)}
            >
              View in Project
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadPageContent />
    </Suspense>
  );
}