import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 임시: 인증 비활성화 - 모든 입력 허용
    try {
      if (!email || !speakerId) {
        toast.error("이메일과 발표자 ID를 모두 입력해주세요.");
        setIsLoading(false);
        return;
      }

      // 임시 세션 정보 생성
      const tempSession = {
        id: speakerId,
        email: email,
        name: "테스트 발표자",
        speakerId: speakerId,
        eventName: "테스트 행사",
        presentationDate: new Date().toISOString(),
      };

      // Store session in localStorage
      localStorage.setItem('speakerSession', JSON.stringify(tempSession));
      
      toast.success("로그인 성공!");
      navigate("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }

    /* 
    // TODO: 나중에 실제 인증 활성화
    try {
      // Verify speaker with external DB
      const { data, error } = await supabase.functions.invoke('verify-speaker', {
        body: { email, speakerId }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      if (data.success && data.speaker) {
        // Create or update speaker session in local DB
        const { error: sessionError } = await supabase
          .from('speaker_sessions')
          .upsert({
            email: data.speaker.email,
            speaker_id: data.speaker.speakerId,
            external_supplier_id: data.speaker.id,
            speaker_name: data.speaker.name,
            event_name: data.speaker.eventName,
            presentation_date: data.speaker.presentationDate,
          });

        if (sessionError) {
          console.error('Session creation error:', sessionError);
        }

        // Store session in localStorage
        localStorage.setItem('speakerSession', JSON.stringify(data.speaker));
        
        toast.success("로그인 성공!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            발표자 포털
          </CardTitle>
          <CardDescription className="text-base">
            국제회의 발표자 관리 시스템
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="speaker@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="speakerId">발표자 ID</Label>
              <Input
                id="speakerId"
                type="text"
                placeholder="SPK-2024-001"
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>발표자 정보는 이메일로 발송되었습니다.</p>
            <p className="mt-1">문의사항은 주최측에 연락해주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
