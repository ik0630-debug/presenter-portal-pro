import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Car, Train, Plane, Bus, Navigation } from "lucide-react";

// Temporary type definitions
interface TransportationInfo {
  id: string;
  session_id: string;
  transportation_method: string;
  departure_location: string | null;
  departure_date: string | null;
  departure_time: string | null;
  arrival_location: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  train_number: string | null;
  seat_number: string | null;
  flight_number: string | null;
  airline: string | null;
  requires_reimbursement: boolean;
  estimated_cost: number | null;
  actual_cost: number | null;
  receipt_submitted: boolean;
  notes: string | null;
}

const TRANSPORTATION_METHODS = [
  { value: '대중교통', label: '대중교통', icon: Bus },
  { value: '자차', label: '자차', icon: Car },
  { value: 'KTX', label: 'KTX', icon: Train },
  { value: '항공', label: '항공', icon: Plane },
  { value: '기타', label: '기타', icon: Navigation },
];

const TransportationInfo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    transportation_method: '대중교통',
    departure_location: '',
    departure_date: '',
    departure_time: '',
    arrival_location: '',
    arrival_date: '',
    arrival_time: '',
    vehicle_type: '',
    vehicle_number: '',
    train_number: '',
    seat_number: '',
    flight_number: '',
    airline: '',
    requires_reimbursement: false,
    estimated_cost: '',
    actual_cost: '',
    receipt_submitted: false,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const speakerSession = localStorage.getItem("speakerSession");
      if (!speakerSession) {
        setIsLoading(false);
        return;
      }

      const session = JSON.parse(speakerSession);
      setSessionId(session.id);

      // Load transportation info
      const { data, error } = await supabase
        .from('transportation_info' as any)
        .select('*')
        .eq('session_id', session.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const transportInfo = data as unknown as TransportationInfo;
        setFormData({
          transportation_method: transportInfo.transportation_method || '대중교통',
          departure_location: transportInfo.departure_location || '',
          departure_date: transportInfo.departure_date || '',
          departure_time: transportInfo.departure_time || '',
          arrival_location: transportInfo.arrival_location || '',
          arrival_date: transportInfo.arrival_date || '',
          arrival_time: transportInfo.arrival_time || '',
          vehicle_type: transportInfo.vehicle_type || '',
          vehicle_number: transportInfo.vehicle_number || '',
          train_number: transportInfo.train_number || '',
          seat_number: transportInfo.seat_number || '',
          flight_number: transportInfo.flight_number || '',
          airline: transportInfo.airline || '',
          requires_reimbursement: transportInfo.requires_reimbursement || false,
          estimated_cost: transportInfo.estimated_cost?.toString() || '',
          actual_cost: transportInfo.actual_cost?.toString() || '',
          receipt_submitted: transportInfo.receipt_submitted || false,
          notes: transportInfo.notes || '',
        });
      }
    } catch (error: any) {
      console.error(error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
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
        }, {
          onConflict: 'session_id'
        });

      if (error) throw error;

      toast.success("교통편 정보가 저장되었습니다.");
    } catch (error: any) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {TRANSPORTATION_METHODS.map((method) => (
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
