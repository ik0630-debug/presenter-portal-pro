import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, DollarSign, MapPin, Phone, Mail, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrganizerData {
  eventName: string;
  date: string;
  time: string;
  venue: string;
  arrivalTime: string;
  honorarium: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  attendees: string;
}

const OrganizerInfo = () => {
  const [organizerData, setOrganizerData] = useState<OrganizerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizerInfo = async () => {
      try {
        const sessionStr = localStorage.getItem('speakerSession');
        if (!sessionStr) {
          toast.error('세션 정보를 찾을 수 없습니다.');
          return;
        }

        const session = JSON.parse(sessionStr);

        const { data, error } = await supabase.functions.invoke('get-organizer-info', {
          body: { speakerId: session.id }
        });

        if (error) throw error;

        if (data.error) {
          toast.error(data.error);
        } else {
          setOrganizerData(data);
        }
      } catch (error) {
        console.error('Failed to fetch organizer info:', error);
        toast.error('주최측 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerInfo();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">정보를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organizerData) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">주최측 정보를 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            content={`${organizerData.date ? new Date(organizerData.date).toLocaleDateString('ko-KR') : '미정'} ${organizerData.time}`}
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
