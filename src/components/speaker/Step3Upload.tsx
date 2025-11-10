import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadFile } from '@/services/externalApi';

interface DynamicField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Step3UploadProps {
  fields: DynamicField[];
  uploadDeadline?: string;
  existingData?: Record<string, any>;
  projectId: string;
  speakerEmail: string;
  responseId?: string;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Upload = ({ 
  fields, 
  uploadDeadline, 
  existingData, 
  projectId,
  speakerEmail,
  responseId,
  onSave, 
  onNext, 
  onPrev 
}: Step3UploadProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = fields
      .filter((field) => field.required && !formData[field.id])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      toast.error(`다음 필수 항목을 입력해주세요: ${missingFields.join(', ')}`);
      return;
    }

    // 파일 업로드
    if (file) {
      setUploading(true);
      try {
        const uploadResult = await uploadFile(
          projectId,
          speakerEmail,
          'presentation',
          file,
          responseId
        );
        
        if (uploadResult) {
          formData.uploadedFile = {
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl
          };
        }
      } catch (error) {
        toast.error('파일 업로드 중 오류가 발생했습니다.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setSaving(true);
    const success = await onSave(formData);
    setSaving(false);

    if (success) {
      toast.success('발표자료 정보가 저장되었습니다.');
      onNext();
    } else {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  const daysLeft = uploadDeadline 
    ? Math.ceil((new Date(uploadDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: 발표자료 업로드</CardTitle>
        <CardDescription>
          발표자료를 업로드하고 관련 정보를 입력해주세요.
        </CardDescription>
        {uploadDeadline && (
          <div className={`text-sm font-medium ${daysLeft && daysLeft > 0 ? 'text-orange-600' : 'text-destructive'}`}>
            업로드 마감일: {uploadDeadline}
            {daysLeft !== null && (
              daysLeft > 0 
                ? ` (⏰ ${daysLeft}일 남음)` 
                : ' (⚠️ 마감일 지남)'
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">발표자료 파일</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".ppt,.pptx,.pdf"
            />
            {formData.uploadedFile && (
              <p className="text-sm text-muted-foreground">
                업로드된 파일: {formData.uploadedFile.fileName}
              </p>
            )}
          </div>

          {fields.map((field) => (
            <DynamicFieldRenderer
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={handleFieldChange}
            />
          ))}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              이전 단계로
            </Button>
            <Button type="submit" disabled={uploading || saving}>
              {uploading ? '업로드 중...' : saving ? '저장 중...' : '저장하고 다음 단계로'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
