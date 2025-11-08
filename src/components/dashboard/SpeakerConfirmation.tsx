import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";

interface SpeakerConfirmationProps {
  onConfirm: () => void;
}

const SpeakerConfirmation = ({ onConfirm }: SpeakerConfirmationProps) => {
  const [confirmed, setConfirmed] = useState(false);

  // TODO: 실제 데이터는 세션에서 가져와야 함
  const sessionData = JSON.parse(localStorage.getItem('speakerSession') || '{}');
  const eventData = {
    eventName: "2024 국제 AI 컨퍼런스",
    eventDate: "2024년 12월 15일",
    speakerName: sessionData.name || "테스트 발표자",
    presentationTitle: "인공지능의 미래와 산업 적용",
    presentationTime: "14:00 - 14:45 (45분)",
    venue: "서울 코엑스 그랜드볼룸",
    expectedAttendees: "약 500명",
    sessionType: "기조연설",
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="inline-block mx-auto p-3 bg-primary/10 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            발표자 정보 확인
          </CardTitle>
          <CardDescription className="text-base">
            아래 정보를 확인하시고 본인이 맞다면 계속 진행해주세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 행사 정보 */}
          <div className="bg-gradient-accent p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-2">
              {eventData.eventName}
            </h3>
            <p className="text-white/90">{eventData.eventDate}</p>
          </div>

          {/* 발표자 정보 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">발표자</p>
                  <p className="text-xl font-bold">{eventData.speakerName}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">세션 구분</p>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {eventData.sessionType}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 발표 프로그램 */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">발표 프로그램</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">발표 제목</p>
                <p className="text-lg font-semibold">{eventData.presentationTitle}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">발표 시간</p>
                    <p className="font-medium">{eventData.presentationTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">장소</p>
                    <p className="font-medium">{eventData.venue}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">예상 참석 인원</p>
                  <p className="font-medium">{eventData.expectedAttendees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 안내 사항 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  다음 단계 안내
                </p>
                <ul className="space-y-1 text-muted-foreground ml-6">
                  <li>1. 발표 관련 동의서 작성</li>
                  <li>2. 발표 자료 업로드</li>
                  <li>3. 발표 정보 입력</li>
                  <li>4. 강연료 지급 정보 입력</li>
                  <li>5. 현장 도착 안내 확인</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 확인 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/auth'}
            >
              본인이 아닙니다
            </Button>
            <Button
              className="flex-1 text-base h-12"
              onClick={handleConfirm}
              disabled={confirmed}
            >
              {confirmed ? "진행 중..." : "네, 본인 맞습니다"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeakerConfirmation;
