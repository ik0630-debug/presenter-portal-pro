import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ConsentItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
}

interface Step4ConsentProps {
  items: ConsentItem[];
  existingData?: Record<string, boolean>;
  onSave: (data: Record<string, boolean>) => Promise<boolean>;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4Consent = ({ items, existingData, onSave, onNext, onPrev }: Step4ConsentProps) => {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingData) {
      setConsents(existingData);
    } else {
      // 초기값 설정
      const initial: Record<string, boolean> = {};
      items.forEach(item => {
        initial[item.id] = false;
      });
      setConsents(initial);
    }
  }, [existingData, items]);

  const handleConsentChange = (itemId: string, checked: boolean) => {
    setConsents((prev) => ({ ...prev, [itemId]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 동의 항목 검증
    const missingConsents = items
      .filter((item) => item.required && !consents[item.id])
      .map((item) => item.label);

    if (missingConsents.length > 0) {
      toast.error(`다음 필수 동의 항목에 체크해주세요: ${missingConsents.join(', ')}`);
      return;
    }

    setSaving(true);
    const success = await onSave(consents);
    setSaving(false);

    if (success) {
      toast.success('동의서가 제출되었습니다.');
      onNext();
    } else {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: 동의서</CardTitle>
        <CardDescription>아래 동의 항목을 확인하고 체크해주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="space-y-2 border-b pb-4 last:border-0">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={item.id}
                  checked={consents[item.id] || false}
                  onCheckedChange={(checked) => handleConsentChange(item.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={item.id} 
                    className="text-base font-medium cursor-pointer"
                  >
                    {item.label}
                    {item.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
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
