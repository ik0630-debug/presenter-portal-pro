import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, DollarSign, MapPin, Phone, Mail, Users } from "lucide-react";

const OrganizerInfo = () => {
  // TODO: 실제 데이터는 서버에서 가져와야 함
  const organizerData = {
    eventName: "2024 국제 AI 컨퍼런스",
    date: "2024년 12월 15일",
    time: "14:00 - 14:45",
    venue: "서울 코엑스 그랜드볼룸",
    arrivalTime: "13:30까지 도착 요청",
    honorarium: "500,000원",
    contact: {
      name: "홍보팀 김담당",
      phone: "02-1234-5678",
      email: "contact@conference.com",
    },
    attendees: "약 500명",
  };

  const InfoCard = ({ icon: Icon, title, content, badge }: any) => (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-base font-semibold mt-1">{content}</p>
        {badge && (
          <Badge variant="outline" className="mt-2">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-accent/20 bg-gradient-accent">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {organizerData.eventName}
          </CardTitle>
          <CardDescription className="text-white/80">
            주최측에서 제공하는 행사 정보입니다
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">발표 일정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoCard
            icon={CalendarClock}
            title="발표 일시"
            content={`${organizerData.date} ${organizerData.time}`}
            badge={organizerData.arrivalTime}
          />
          <InfoCard
            icon={MapPin}
            title="발표 장소"
            content={organizerData.venue}
          />
          <InfoCard
            icon={Users}
            title="예상 참석 인원"
            content={organizerData.attendees}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">강연비 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoCard
            icon={DollarSign}
            title="강연료"
            content={organizerData.honorarium}
            badge="세금 별도"
          />
          <p className="text-sm text-muted-foreground mt-3">
            • 발표 종료 후 14일 이내 지급 예정
          </p>
          <p className="text-sm text-muted-foreground">
            • 계좌 정보는 별도 이메일로 안내 드립니다
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">담당자 연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoCard
            icon={Phone}
            title="전화번호"
            content={organizerData.contact.phone}
          />
          <InfoCard
            icon={Mail}
            title="이메일"
            content={organizerData.contact.email}
          />
          <p className="text-sm text-muted-foreground pt-2 border-t">
            문의사항이 있으시면 언제든 연락 주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerInfo;
