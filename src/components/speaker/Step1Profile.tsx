import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { toast } from 'sonner';

interface DynamicField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Step1ProfileProps {
  fields: DynamicField[];
  existingData?: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onNext: () => void;
}

export const Step1Profile = ({ fields, existingData, onSave, onNext }: Step1ProfileProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    const missingFields = fields
      .filter((field) => field.required && !formData[field.id])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      toast.error(`다음 필수 항목을 입력해주세요: ${missingFields.join(', ')}`);
      return;
    }

    setSaving(true);
    const success = await onSave(formData);
    setSaving(false);

    if (success) {
      toast.success('프로필 정보가 저장되었습니다.');
      onNext();
    } else {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: 프로필 정보</CardTitle>
        <CardDescription>발표자님의 기본 정보를 입력해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <DynamicFieldRenderer
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={handleFieldChange}
            />
          ))}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장하고 다음 단계로'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
