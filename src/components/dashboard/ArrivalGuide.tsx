import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MapPin, Car, DollarSign, Clock, Phone, Download, Printer } from "lucide-react";
import { toast } from "sonner";

const ArrivalGuide = () => {
  const printRef = useRef<HTMLDivElement>(null);

  // TODO: 실제 데이터는 서버에서 가져와야 함
  const arrivalData = {
    eventName: "2024 국제 AI 컨퍼런스",
    date: "2024년 12월 15일",
    time: "14:00 - 14:45",
    arrivalTime: "13:30",
    venue: "서울 코엑스 그랜드볼룸",
    address: "서울특별시 강남구 영동대로 513",
    parking: {
      available: true,
      location: "코엑스 지하주차장 B2~B8",
      fee: "무료 (발표자 차량번호 사전 등록)",
      instructions: "주차 후 행사 데스크에서 주차권 수령",
    },
    contact: {
      name: "홍보팀 김담당",
      phone: "02-1234-5678",
      email: "contact@conference.com",
    },
    honorarium: "500,000원",
    checklistItems: [
      "발표자료 USB 또는 노트북 지참",
      "신분증 지참 (행사장 출입용)",
      "발표 시연용 장비 사전 테스트 (13:45)",
      "발표 시작 30분 전 현장 도착",
    ],
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

  return (
    <div className="space-y-4">
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

      <div ref={printRef} className="space-y-4">
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

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">발표 일정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoSection icon={CalendarClock} title="발표 일시">
              <p className="text-base font-semibold">
                {arrivalData.date} {arrivalData.time}
              </p>
            </InfoSection>

            <InfoSection icon={Clock} title="도착 시간">
              <p className="text-base font-semibold text-destructive">
                {arrivalData.arrivalTime}까지 필수 도착
              </p>
              <Badge variant="outline" className="mt-2">
                발표 시작 30분 전 현장 도착 필수
              </Badge>
            </InfoSection>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">장소 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoSection icon={MapPin} title="발표 장소">
              <p className="text-base font-semibold mb-1">
                {arrivalData.venue}
              </p>
              <p className="text-sm text-muted-foreground">
                {arrivalData.address}
              </p>
            </InfoSection>

            {arrivalData.parking.available && (
              <InfoSection icon={Car} title="주차 안내">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">주차 위치:</span>
                    <span className="text-sm">{arrivalData.parking.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">주차 요금:</span>
                    <span className="text-sm">{arrivalData.parking.fee}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {arrivalData.parking.instructions}
                  </p>
                </div>
              </InfoSection>
            )}
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">강연료 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={DollarSign} title="강연료">
              <p className="text-base font-semibold">{arrivalData.honorarium}</p>
              <p className="text-sm text-muted-foreground mt-2">
                발표 종료 후 14일 이내 지급 예정
              </p>
            </InfoSection>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">현장 체크리스트</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {arrivalData.checklistItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 print:border-black">
                    <div className="w-2 h-2 rounded-full bg-primary print:bg-black" />
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">담당자 연락처</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoSection icon={Phone} title="긴급 연락처">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">담당자:</span> {arrivalData.contact.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">전화:</span> {arrivalData.contact.phone}
                </p>
                <p className="text-sm">
                  <span className="font-medium">이메일:</span> {arrivalData.contact.email}
                </p>
              </div>
            </InfoSection>
          </CardContent>
        </Card>

        <Card className="border-accent/20 print:shadow-none">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">참고 사항</p>
              <p>• 발표자료는 사전에 이메일로 제출하시거나 USB를 지참해 주세요.</p>
              <p>• 현장 도착 후 행사 데스크에서 체크인 해주세요.</p>
              <p>• 발표 시작 15분 전 발표장에서 음향 및 영상 테스트를 진행합니다.</p>
              <p>• 문의사항이 있으시면 언제든 담당자에게 연락 주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArrivalGuide;
