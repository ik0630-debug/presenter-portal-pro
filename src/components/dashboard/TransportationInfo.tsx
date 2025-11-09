import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Car, Train, Plane, Bus, Navigation, Calendar, Upload, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "@/hooks/useSession";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { 
  AttendanceField, 
  TransportationSettings, 
  TransportationInfo as TransportationInfoType 
} from "@/types/database";

const TRANSPORTATION_METHODS = [
  { value: '대중교통', label: '대중교통', icon: Bus },
  { value: '자차', label: '자차', icon: Car },
  { value: 'KTX', label: 'KTX', icon: Train },
  { value: '항공', label: '항공', icon: Plane },
  { value: '기타', label: '기타', icon: Navigation },
];

const TransportationInfo = () => {
  const { session, sessionId, projectId, loading: sessionLoading } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceResponses, setAttendanceResponses] = useState<Record<string, boolean>>({});
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  
  // Load attendance fields
  const { data: attendanceFields, loading: fieldsLoading } = useSupabaseQuery<AttendanceField[]>({
    table: 'attendance_fields',
    filters: { project_id: projectId },
    orderBy: { column: 'display_order' },
    enabled: !!projectId,
  });

  // Load attendance responses
  const { data: responses, refetch: refetchResponses } = useSupabaseQuery<any[]>({
    table: 'attendance_responses',
    filters: { session_id: sessionId },
    enabled: !!sessionId,
    onSuccess: (data) => {
      const responsesMap: Record<string, boolean> = {};
      data?.forEach((r: any) => {
        responsesMap[r.field_key] = r.response;
      });
      setAttendanceResponses(responsesMap);
    },
  });

  // Load transportation settings
  const { data: transportSettings } = useSupabaseQuery<TransportationSettings>({
    table: 'transportation_settings',
    filters: { project_id: projectId },
    single: true,
    enabled: !!projectId,
  });

  const supportedMethods = transportSettings?.supported_methods || ['대중교통', '자차', 'KTX', '항공', '기타'];
  const requiresReceipt = transportSettings?.requires_receipt ?? false;
  const receiptDeadline = transportSettings?.receipt_deadline;
  const additionalNotes = transportSettings?.additional_notes;

  // Load transportation info
  const { data: existingTransportInfo } = useSupabaseQuery<TransportationInfoType>({
    table: 'transportation_info',
    filters: { session_id: sessionId },
    single: true,
    enabled: !!sessionId,
  });

  const [formData, setFormData] = useState({
    transportation_method: existingTransportInfo?.transportation_method || '대중교통',
    departure_location: existingTransportInfo?.departure_location || '',
    departure_date: existingTransportInfo?.departure_date || '',
    departure_time: existingTransportInfo?.departure_time || '',
    arrival_location: existingTransportInfo?.arrival_location || '',
    arrival_date: existingTransportInfo?.arrival_date || '',
    arrival_time: existingTransportInfo?.arrival_time || '',
    vehicle_type: existingTransportInfo?.vehicle_type || '',
    vehicle_number: existingTransportInfo?.vehicle_number || '',
    train_number: existingTransportInfo?.train_number || '',
    seat_number: existingTransportInfo?.seat_number || '',
    flight_number: existingTransportInfo?.flight_number || '',
    airline: existingTransportInfo?.airline || '',
    requires_reimbursement: existingTransportInfo?.requires_reimbursement || false,
    estimated_cost: existingTransportInfo?.estimated_cost?.toString() || '',
    actual_cost: existingTransportInfo?.actual_cost?.toString() || '',
    receipt_submitted: existingTransportInfo?.receipt_submitted || false,
    notes: existingTransportInfo?.notes || '',
    receipt_file_path: existingTransportInfo?.receipt_file_path || '',
  });

  const handleAttendanceChange = async (fieldKey: string, checked: boolean) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('attendance_responses' as any)
        .upsert({
          session_id: sessionId,
          field_key: fieldKey,
          response: checked,
        });

      if (error) throw error;

      setAttendanceResponses(prev => ({
        ...prev,
        [fieldKey]: checked,
      }));

      toast.success("참석 정보가 저장되었습니다.");
      await refetchResponses();
    } catch (error: any) {
      console.error('Error saving attendance response:', error);
      toast.error("참석 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const handleReceiptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기는 10MB를 초과할 수 없습니다.`);
        return false;
      }
      return true;
    });
    
    setReceiptFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length}개의 영수증 파일이 추가되었습니다.`);
    }
  };

  const handleRemoveReceiptFile = (index: number) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index));
    toast.info("영수증 파일이 제거되었습니다.");
  };

  const handleSave = async () => {
    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      let receiptPath = formData.receipt_file_path;
      
      // Upload receipt files if any
      if (receiptFiles.length > 0) {
        const file = receiptFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${sessionId}_${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('presentations')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        receiptPath = filePath;
      }

      const { error } = await supabase
        .from('transportation_info' as any)
        .upsert({
          session_id: sessionId,
          transportation_method: formData.transportation_method,
          departure_location: formData.departure_location || null,
          departure_date: formData.departure_date || null,
          departure_time: formData.departure_time || null,
          arrival_location: formData.arrival_location || null,
          arrival_date: formData.arrival_date || null,
          arrival_time: formData.arrival_time || null,
          vehicle_type: formData.vehicle_type || null,
          vehicle_number: formData.vehicle_number || null,
          train_number: formData.train_number || null,
          seat_number: formData.seat_number || null,
          flight_number: formData.flight_number || null,
          airline: formData.airline || null,
          requires_reimbursement: formData.requires_reimbursement,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
          actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
          receipt_submitted: formData.receipt_submitted,
          notes: formData.notes || null,
          receipt_file_path: receiptPath || null,
        }, {
          onConflict: 'session_id'
        });

      if (error) throw error;

      toast.success("교통편 정보가 저장되었습니다.");
      setReceiptFiles([]);
    } catch (error: any) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">세션 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 행사 참석 정보 섹션 */}
      {attendanceFields && attendanceFields.length > 0 && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>행사 참석 정보</CardTitle>
            <CardDescription>
              행사 참석과 관련된 정보를 확인하고 응답해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {attendanceFields.map((field) => {
              const isPastDeadline = field.deadline && new Date(field.deadline) < new Date();
              
              return (
                <div key={field.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={field.field_key}
                      checked={attendanceResponses[field.field_key] || false}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(field.field_key, checked as boolean)
                      }
                      disabled={isPastDeadline}
                    />
                    <div className="flex-1 space-y-1">
                      <Label 
                        htmlFor={field.field_key}
                        className={`text-base font-medium cursor-pointer ${isPastDeadline ? 'text-muted-foreground' : ''}`}
                      >
                        {field.field_label}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {field.field_description}
                      </p>
                      {field.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            마감: {format(new Date(field.deadline), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                            {isPastDeadline ? ' (마감됨)' : ''}
                          </span>
                        </div>
                      )}
                      {!isPastDeadline && field.deadline && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          마감일 이후 변경사항은 반영되지 않을 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 교통편 정보 섹션 */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>교통수단 선택</CardTitle>
          <CardDescription>행사장까지 이용하실 교통수단을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.transportation_method}
            onValueChange={(value) => setFormData({ ...formData, transportation_method: value })}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {TRANSPORTATION_METHODS.filter(m => supportedMethods.includes(m.value)).map((method) => (
              <Label
                key={method.value}
                htmlFor={method.value}
                className="flex flex-col items-center gap-3 cursor-pointer rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                <method.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{method.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 이동 정보 */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>이동 정보</CardTitle>
          <CardDescription>출발지와 도착지 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_location">출발지</Label>
              <Input
                id="departure_location"
                value={formData.departure_location}
                onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
                placeholder="예: 서울역"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_location">도착지</Label>
              <Input
                id="arrival_location"
                value={formData.arrival_location}
                onChange={(e) => setFormData({ ...formData, arrival_location: e.target.value })}
                placeholder="예: 코엑스"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_date">출발일</Label>
              <Input
                id="departure_date"
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure_time">출발시간</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrival_date">도착일</Label>
              <Input
                id="arrival_date"
                type="date"
                value={formData.arrival_date}
                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_time">도착시간</Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time}
                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자차 정보 */}
      {formData.transportation_method === '자차' && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>차량 정보</CardTitle>
            <CardDescription>주차 등록을 위한 차량 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">차종</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="예: 소나타"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">차량번호</Label>
                <Input
                  id="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  placeholder="예: 12가 3456"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KTX 정보 */}
      {formData.transportation_method === 'KTX' && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>KTX 정보</CardTitle>
            <CardDescription>예약하신 열차 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="train_number">열차번호</Label>
                <Input
                  id="train_number"
                  value={formData.train_number}
                  onChange={(e) => setFormData({ ...formData, train_number: e.target.value })}
                  placeholder="예: KTX 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seat_number">좌석번호</Label>
                <Input
                  id="seat_number"
                  value={formData.seat_number}
                  onChange={(e) => setFormData({ ...formData, seat_number: e.target.value })}
                  placeholder="예: 3A"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항공편 정보 */}
      {formData.transportation_method === '항공' && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>항공편 정보</CardTitle>
            <CardDescription>예약하신 항공편 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="airline">항공사</Label>
                <Input
                  id="airline"
                  value={formData.airline}
                  onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                  placeholder="예: 대한항공"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flight_number">항공편명</Label>
                <Input
                  id="flight_number"
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  placeholder="예: KE123"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 교통비 정보 */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>교통비 정보</CardTitle>
          <CardDescription>교통비 청구 여부와 예상 비용을 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requires_reimbursement">교통비 청구</Label>
              <p className="text-sm text-muted-foreground">
                교통비 환급이 필요하신가요?
              </p>
            </div>
            <Switch
              id="requires_reimbursement"
              checked={formData.requires_reimbursement}
              onCheckedChange={(checked) => setFormData({ ...formData, requires_reimbursement: checked })}
            />
          </div>

          {formData.requires_reimbursement && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">예상 비용 (원)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  placeholder="예: 50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_cost">실제 비용 (원)</Label>
                <Input
                  id="actual_cost"
                  type="number"
                  value={formData.actual_cost}
                  onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                  placeholder="실제 지출한 금액"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 영수증 업로드 섹션 */}
      {requiresReceipt && (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>교통비 영수증</CardTitle>
            <CardDescription className="space-y-1">
              <p>교통비 실비 지급을 위해 영수증을 첨부해 주세요</p>
              {receiptDeadline && (
                <div className="flex items-center gap-1 text-sm text-destructive font-medium mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>마감: {format(new Date(receiptDeadline), "yyyy년 M월 d일 HH:mm", { locale: ko })}</span>
                </div>
              )}
              {receiptDeadline && new Date(receiptDeadline) > new Date() && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  마감일 이후 변경사항은 반영되지 않을 수 있습니다.
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 영수증 인정 안내 */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">인정항목</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>국내 항공</li>
                  <li>기차</li>
                  <li>고속(시외)버스</li>
                  <li>택시 영수증(시내 이동에 한하며, 최대 2만원 한도)</li>
                  <li>톨게이트 영수증</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">불인정항목</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>타인 명의로 발행된 항공권</li>
                  <li>유류비(주유비)</li>
                </ul>
              </div>
            </div>

            {additionalNotes && (
              <div className="p-4 bg-accent/10 rounded-lg text-sm border border-accent/20">
                <p className="whitespace-pre-line">{additionalNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>영수증 파일</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    클릭하여 영수증 파일 선택
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, PDF (10MB 이내, 여러 파일 선택 가능)
                  </p>
                  <input
                    id="receipt-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleReceiptFileSelect}
                  />
                </label>
              </div>
            </div>

            {/* 업로드된 영수증 목록 */}
            {receiptFiles.length > 0 && (
              <div className="space-y-2">
                <Label>첨부된 영수증 ({receiptFiles.length}개)</Label>
                <div className="space-y-2">
                  {receiptFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReceiptFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 추가 정보 */}
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>추가 정보</CardTitle>
          <CardDescription>특이사항이나 요청사항을 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="예: 장애인 주차 구역 필요, 짐이 많아 캐리어 보관 필요 등"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
};

export default TransportationInfo;
