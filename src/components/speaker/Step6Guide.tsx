import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getStep6Data } from '@/services/externalApi';

interface Step6Field {
  id: string;
  label: string;
  displayValue: string;
  data_source: 'auto' | 'manual';
}

interface Step6GuideProps {
  projectId: string;
  speakerEmail: string;
  onPrev: () => void;
}

export const Step6Guide = ({ projectId, speakerEmail, onPrev }: Step6GuideProps) => {
  const [fields, setFields] = useState<Step6Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuideData();
  }, [projectId, speakerEmail]);

  const loadGuideData = async () => {
    setLoading(true);
    try {
      const data = await getStep6Data(projectId, speakerEmail);
      
      if (data) {
        // 데이터를 필드 배열로 변환
        const fieldsArray: Step6Field[] = [
          { id: 'eventName', label: '행사명', displayValue: data.eventName || '', data_source: 'auto' as const },
          { id: 'venue', label: '장소', displayValue: data.venue || '', data_source: 'auto' as const },
          { id: 'address', label: '주소', displayValue: data.address || '', data_source: 'auto' as const },
          { id: 'room', label: '발표실', displayValue: data.room || '', data_source: 'auto' as const },
          { id: 'time', label: '발표 시간', displayValue: data.time || '', data_source: 'auto' as const },
          { id: 'checkInTime', label: '체크인 시간', displayValue: data.checkInTime || '', data_source: 'manual' as const },
          { id: 'checkInLocation', label: '체크인 장소', displayValue: data.checkInLocation || '', data_source: 'manual' as const },
          { id: 'parking', label: '주차 안내', displayValue: data.parking || '', data_source: 'manual' as const },
          { id: 'contact', label: '담당자 연락처', displayValue: data.contact ? `${data.contact.name} (${data.contact.phone})` : '', data_source: 'manual' as const },
          { id: 'emergency', label: '비상 연락처', displayValue: data.emergency || '', data_source: 'manual' as const },
          { id: 'notes', label: '추가 안내사항', displayValue: data.notes || '', data_source: 'manual' as const },
        ].filter(field => field.displayValue); // 값이 있는 필드만 표시
        
        setFields(fieldsArray);
      }
    } catch (error) {
      toast.error('현장 안내 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">현장 안내 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 6: 현장 안내</CardTitle>
        <CardDescription>
          행사 당일 필요한 정보를 확인하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            아직 현장 안내 정보가 등록되지 않았습니다.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {field.label}
                    {field.data_source === 'auto' && (
                      <span className="ml-2 text-xs text-muted-foreground">(자동 연동)</span>
                    )}
                  </Label>
                  <div className={`p-3 rounded-md ${
                    field.data_source === 'auto' 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' 
                      : 'bg-muted'
                  }`}>
                    {field.displayValue || '정보 없음'}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ 모든 단계를 완료하셨습니다! 행사 당일 뵙겠습니다.
              </p>
            </div>
          </>
        )}
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrev}>
            이전 단계로
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
