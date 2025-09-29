'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function OCRTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const testOCR = async () => {
    if (!file) return;

    setTesting(true);
    setError(null);
    setResult(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Test OCR API directly
      const response = await fetch('/api/ocr/test-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl: base64,
          fileType: file.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR test failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('OCR test error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">OCR API Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the Mistral OCR API directly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Test File</CardTitle>
          <CardDescription>
            Select an invoice image or PDF to test OCR processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={testOCR}
            disabled={!file || testing}
            className="w-full"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Testing OCR...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Test OCR Processing
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-500">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              OCR Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.method && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method Used</p>
                  <p>{result.method}</p>
                </div>
              )}
              
              {result.extracted && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Extracted Data</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(result.extracted, null, 2)}
                  </pre>
                </div>
              )}

              {result.raw && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Raw Response</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}