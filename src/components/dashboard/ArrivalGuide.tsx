import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, MapPin, Car, Clock, Phone, Download, Printer, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { ArrivalGuideSettings } from "@/types/database";

interface ArrivalChecklistItem {
  id: string;
  project_id: string;
  item_text: string;
  display_order: number;
  requires_response: boolean;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  requires_response: boolean;
  is_checked?: boolean;
  response_text?: string;
}

interface ArrivalChecklistItem {
  id: string;
  project_id: string;
  item_text: string;
  display_order: number;
  requires_response: boolean;
  created_at: string;
  updated_at: string;
}

interface SpeakerChecklistResponse {
  id: string;
  session_id: string;
  checklist_item_id: string;
  is_checked: boolean;
  response_text: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  requires_response: boolean;
  is_checked?: boolean;
  response_text?: string;
}

const ArrivalGuide = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const { session, sessionId, projectId, loading: sessionLoading } = useSession();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Load arrival guide settings
  const { data: guideSettings, loading: guideLoading } = useSupabaseQuery<ArrivalGuideSettings>({
    table: 'arrival_guide_settings',
    filters: { project_id: projectId },
    single: true,
    enabled: !!projectId,
  });

  const arrivalData = {
    eventName: session?.event_name || "2024 AI 컨퍼런스",
    venue: guideSettings?.venue_name || "서울 코엑스",
    address: guideSettings?.venue_address || "서울특별시 강남구 영동대로 513",
    room: guideSettings?.presentation_room || "그랜드볼룸 A홀",
    time: guideSettings?.presentation_time || "2024년 12월 15일 (금) 14:00 - 15:30",
    checkInTime: guideSettings?.check_in_time || "13:30까지",
    checkInLocation: guideSettings?.check_in_location || "2층 리셉션 데스크",
    parking: guideSettings?.parking_info || "지하 2-3층 주차장 이용 가능\n발표자 주차권은 리셉션 데스크에서 수령 가능합니다.\n주차장 만차 시 인근 공영주차장을 이용해주세요.",
    contact: {
      name: guideSettings?.contact_name || "김행사 담당자",
      phone: guideSettings?.contact_phone || "010-1234-5678",
      email: guideSettings?.contact_email || "event@example.com",
    },
    emergency: guideSettings?.emergency_contact || "긴급 상황 시: 010-9999-8888 (24시간 운영)",
    notes: guideSettings?.additional_notes || "• 발표 30분 전까지 현장 도착 부탁드립니다.\n• 발표 자료는 USB 또는 노트북으로 준비해주세요.\n• 현장에서 간단한 리허설이 가능합니다.\n• 물과 다과가 준비되어 있습니다.",
  };

  // Load checklist items
  const { data: checklistData } = useSupabaseQuery<ArrivalChecklistItem[]>({
    table: 'arrival_checklist_items',
    filters: { project_id: projectId },
    orderBy: { column: 'display_order' },
    enabled: !!projectId,
    onSuccess: async (items) => {
      if (!sessionId || !items?.length) {
        // 샘플 데이터 설정
        setChecklistItems([
          {
            id: 'sample-1',
            item_text: '발표 자료를 USB 또는 노트북에 준비했습니다.',
            requires_response: false,
            is_checked: false,
          },
          {
            id: 'sample-2',
            item_text: '현장 주차 또는 대중교통 경로를 확인했습니다.',
            requires_response: false,
            is_checked: false,
          },
          {
            id: 'sample-3',
            item_text: '특별히 필요한 장비나 요청사항이 있으신가요?',
            requires_response: true,
            is_checked: false,
            response_text: '',
          },
          {
            id: 'sample-4',
            item_text: '식이 제한이나 알러지가 있으신가요?',
            requires_response: true,
            is_checked: false,
            response_text: '',
          },
        ]);
        return;
      }

      try {
        // Load speaker responses
        const { data: responses } = await supabase
          .from('speaker_checklist_responses' as any)
          .select('*')
          .eq('session_id', sessionId);

        const responseMap = new Map(
          (responses || []).map((r: any) => [r.checklist_item_id, r])
        );

        setChecklistItems(items.map(item => ({
          id: item.id,
          item_text: item.item_text,
          requires_response: item.requires_response,
          is_checked: responseMap.get(item.id)?.is_checked || false,
          response_text: responseMap.get(item.id)?.response_text || "",
        })));
      } catch (error) {
        console.error('Error loading checklist responses:', error);
      }
    },
  });

  const handleChecklistChange = async (itemId: string, checked: boolean) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('speaker_checklist_responses' as any)
        .upsert({
          session_id: sessionId,
          checklist_item_id: itemId,
          is_checked: checked,
        }, {
          onConflict: 'session_id,checklist_item_id'
        });

      if (error) throw error;

      setChecklistItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, is_checked: checked } : item
        )
      );
    } catch (error: any) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    }
  };

  const handleResponseChange = async (itemId: string, text: string) => {
    if (!sessionId) return;

    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, response_text: text } : item
      )
    );
  };

  const handleResponseBlur = async (itemId: string) => {
    if (!sessionId) return;
    
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('speaker_checklist_responses' as any)
        .upsert({
          session_id: sessionId,
          checklist_item_id: itemId,
          response_text: item.response_text,
          is_checked: item.is_checked || false,
        }, {
          onConflict: 'session_id,checklist_item_id'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success("인쇄 화면이 열렸습니다.");
  };

  const handleDownloadPDF = () => {
    // TODO: PDF 다운로드 구현
    toast.info("PDF 다운로드 기능은 곧 추가될 예정입니다.");
  };

  const InfoSection = ({ icon: Icon, title, children }: any) => (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
      <div className="p-2 rounded-lg bg-primary/10 h-fit">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );

  const isLoading = sessionLoading || guideLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
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

  const hasAnyData = arrivalData.eventName || arrivalData.venue || arrivalData.time || 
                      arrivalData.checkInTime || arrivalData.parking || 
                      arrivalData.contact.name || arrivalData.emergency || 
                      arrivalData.notes || checklistItems.length > 0;

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <MapPinned className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-muted-foreground font-medium">현장 안내 정보가 아직 준비되지 않았습니다.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                행사 담당자가 정보를 등록하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border-0 {
              border: 0 !important;
            }
            .print\\:border-black {
              border-color: black !important;
            }
            .print\\:bg-black {
              background-color: black !important;
            }
          }
        `}
      </style>

      <div className="flex gap-2 justify-end print:hidden">
        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          PDF 다운로드
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          인쇄하기
        </Button>
      </div>

      <div id="printable-area" ref={printRef} className="space-y-4">
        {arrivalData.eventName && (
          <Card className="border-accent/20 bg-gradient-accent print:border-0">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                {arrivalData.eventName}
              </CardTitle>
              <CardDescription className="text-white/90 text-base">
                발표자 현장 도착 안내
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {(arrivalData.time || arrivalData.checkInTime) && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">발표 일정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {arrivalData.time && (
                <InfoSection icon={CalendarClock} title="발표 시간">
                  <p className="text-base font-semibold">
                    {arrivalData.time}
                  </p>
                </InfoSection>
              )}

              {arrivalData.checkInTime && (
                <InfoSection icon={Clock} title="체크인 시간">
                  <p className="text-base font-semibold text-destructive">
                    {arrivalData.checkInTime}
                  </p>
                  {arrivalData.checkInLocation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      장소: {arrivalData.checkInLocation}
                    </p>
                  )}
                </InfoSection>
              )}
            </CardContent>
          </Card>
        )}

        {(arrivalData.venue || arrivalData.parking) && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">장소 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {arrivalData.venue && (
                <InfoSection icon={MapPin} title="발표 장소">
                  <p className="text-base font-semibold mb-1">
                    {arrivalData.venue}
                    {arrivalData.room && ` (${arrivalData.room})`}
                  </p>
                  {arrivalData.address && (
                    <p className="text-sm text-muted-foreground">
                      {arrivalData.address}
                    </p>
                  )}
                </InfoSection>
              )}

              {arrivalData.parking && (
                <InfoSection icon={Car} title="주차 안내">
                  <p className="text-sm whitespace-pre-line">
                    {arrivalData.parking}
                  </p>
                </InfoSection>
              )}
            </CardContent>
          </Card>
        )}

        {checklistItems.length > 0 && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">현장 체크리스트</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li key={item.id} className="space-y-2">
                    <div className="flex items-start gap-3 print:gap-2">
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                        className="mt-1 print:hidden"
                      />
                      <div className="hidden print:block w-5 h-5 rounded border-2 border-black mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm">{item.item_text}</span>
                        {item.requires_response && (
                          <Textarea
                            value={item.response_text}
                            onChange={(e) => handleResponseChange(item.id, e.target.value)}
                            onBlur={() => handleResponseBlur(item.id)}
                            placeholder="응답을 입력하세요..."
                            className="mt-2 print:hidden"
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(arrivalData.contact.name || arrivalData.emergency) && (
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">담당자 연락처</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {arrivalData.contact.name && (
                <InfoSection icon={Phone} title="담당자 정보">
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">담당자:</span> {arrivalData.contact.name}
                    </p>
                    {arrivalData.contact.phone && (
                      <p className="text-sm">
                        <span className="font-medium">전화:</span> {arrivalData.contact.phone}
                      </p>
                    )}
                    {arrivalData.contact.email && (
                      <p className="text-sm">
                        <span className="font-medium">이메일:</span> {arrivalData.contact.email}
                      </p>
                    )}
                  </div>
                </InfoSection>
              )}
              {arrivalData.emergency && (
                <InfoSection icon={Phone} title="긴급 연락처">
                  <p className="text-sm">{arrivalData.emergency}</p>
                </InfoSection>
              )}
            </CardContent>
          </Card>
        )}

        {arrivalData.notes && (
          <Card className="border-accent/20 print:shadow-none">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">참고 사항</p>
                <div className="text-muted-foreground whitespace-pre-line">
                  {arrivalData.notes}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ArrivalGuide;
