import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MapPin, Car, Clock, Phone, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ArrivalGuide = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [arrivalData, setArrivalData] = useState<any>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    loadArrivalData();
  }, []);

  const loadArrivalData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      // Get speaker session and project
      const { data: session } = await supabase
        .from("speaker_sessions")
        .select("project_id, presentation_date, projects:project_id(project_name, event_name)")
        .eq("email", user.email)
        .maybeSingle();

      if (session && session.project_id) {
        // Load arrival guide settings
        const { data: settings } = await supabase
          .from("arrival_guide_settings")
          .select("*")
          .eq("project_id", session.project_id)
          .maybeSingle();

        if (settings) {
          setArrivalData(settings);
          setProjectName((session.projects as any)?.project_name || "");
        }
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success("인쇄 화면이 열렸습니다.");
  };

  const InfoSection = ({ icon: Icon, title, children }: any) => (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors print:border-gray-300">
      <div className="p-2 rounded-lg bg-primary/10 h-fit print:bg-gray-100">
        <Icon className="h-5 w-5 text-primary print:text-gray-700" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 print:text-gray-600">{title}</h3>
        {children}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!arrivalData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            현장안내 정보가 아직 등록되지 않았습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          인쇄하기
        </Button>
      </div>

      <div className="space-y-4 print:space-y-3">
        <Card className="border-accent/20 bg-gradient-accent print:border-gray-300 print:bg-gray-50">
          <CardHeader>
            <CardTitle className="text-white text-xl print:text-gray-900">
              {projectName}
            </CardTitle>
            <CardDescription className="text-white/90 text-base print:text-gray-700">
              발표자 현장 도착 안내
            </CardDescription>
          </CardHeader>
        </Card>

        {(arrivalData.presentation_time || arrivalData.check_in_time) && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardHeader className="print:pb-3">
              <CardTitle className="text-lg">발표 일정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {arrivalData.presentation_time && (
                <InfoSection icon={CalendarClock} title="발표 시간">
                  <p className="text-base font-semibold">
                    {arrivalData.presentation_time}
                  </p>
                </InfoSection>
              )}

              {arrivalData.check_in_time && (
                <InfoSection icon={Clock} title="체크인 시간">
                  <p className="text-base font-semibold text-destructive print:text-red-600">
                    {arrivalData.check_in_time}
                  </p>
                  {arrivalData.check_in_location && (
                    <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
                      장소: {arrivalData.check_in_location}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-2 print:border-gray-400">
                    발표 시작 전 필수 체크인
                  </Badge>
                </InfoSection>
              )}
            </CardContent>
          </Card>
        )}

        {(arrivalData.venue_name || arrivalData.venue_address) && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardHeader className="print:pb-3">
              <CardTitle className="text-lg">장소 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoSection icon={MapPin} title="발표 장소">
                {arrivalData.venue_name && (
                  <p className="text-base font-semibold mb-1">
                    {arrivalData.venue_name}
                  </p>
                )}
                {arrivalData.venue_address && (
                  <p className="text-sm text-muted-foreground print:text-gray-600">
                    {arrivalData.venue_address}
                  </p>
                )}
                {arrivalData.presentation_room && (
                  <p className="text-sm text-muted-foreground mt-1 print:text-gray-600">
                    발표장: {arrivalData.presentation_room}
                  </p>
                )}
              </InfoSection>

              {arrivalData.parking_info && (
                <InfoSection icon={Car} title="주차 안내">
                  <div className="space-y-2">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground print:text-gray-700">
                      {arrivalData.parking_info}
                    </pre>
                  </div>
                </InfoSection>
              )}
            </CardContent>
          </Card>
        )}

        {arrivalData.additional_notes && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardHeader className="print:pb-3">
              <CardTitle className="text-lg">체크리스트 및 안내사항</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground print:text-gray-700">
                {arrivalData.additional_notes}
              </pre>
            </CardContent>
          </Card>
        )}

        {(arrivalData.contact_name || arrivalData.contact_phone || arrivalData.contact_email || arrivalData.emergency_contact) && (
          <Card className="print:shadow-none print:border-gray-300">
            <CardHeader className="print:pb-3">
              <CardTitle className="text-lg">담당자 연락처</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoSection icon={Phone} title="연락처 정보">
                <div className="space-y-1">
                  {arrivalData.contact_name && (
                    <p className="text-sm">
                      <span className="font-medium">담당자:</span> {arrivalData.contact_name}
                    </p>
                  )}
                  {arrivalData.contact_phone && (
                    <p className="text-sm">
                      <span className="font-medium">전화:</span> {arrivalData.contact_phone}
                    </p>
                  )}
                  {arrivalData.contact_email && (
                    <p className="text-sm">
                      <span className="font-medium">이메일:</span> {arrivalData.contact_email}
                    </p>
                  )}
                  {arrivalData.emergency_contact && (
                    <p className="text-sm text-destructive font-medium mt-2 print:text-red-600">
                      긴급 연락: {arrivalData.emergency_contact}
                    </p>
                  )}
                </div>
              </InfoSection>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-4, .space-y-4 * {
            visibility: visible;
          }
          .space-y-4 {
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
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          .print\\:text-gray-700 {
            color: #374151 !important;
          }
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          .print\\:text-red-600 {
            color: #dc2626 !important;
          }
          .print\\:border-gray-400 {
            border-color: #9ca3af !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default ArrivalGuide;

