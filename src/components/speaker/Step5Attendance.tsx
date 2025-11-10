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

interface Step5AttendanceProps {
  fields: DynamicField[];
  showTransportation: boolean;
  existingData?: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5Attendance = ({ 
  fields, 
  showTransportation, 
  existingData, 
  onSave, 
  onNext, 
  onPrev 
}: Step5AttendanceProps) => {
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
      toast.success('참석 확인 정보가 저장되었습니다.');
      onNext();
    } else {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: 참석 확인</CardTitle>
        <CardDescription>행사 참석 관련 정보를 입력해주세요.</CardDescription>
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

          {showTransportation && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 교통편 정보는 다음 단계에서 확인하실 수 있습니다.
              </p>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              이전 단계로
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장하고 다음 단계로'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
