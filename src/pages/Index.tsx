import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: FileText,
      title: "간편한 자료 관리",
      description: "발표자료를 쉽게 업로드하고 마감시간까지 자유롭게 수정할 수 있습니다",
    },
    {
      icon: Shield,
      title: "안전한 정보 보호",
      description: "발표자 인증을 통해 안전하게 자료를 관리합니다",
    },
    {
      icon: Clock,
      title: "실시간 커뮤니케이션",
      description: "주최측과 실시간으로 정보를 주고받을 수 있습니다",
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 개발/테스트 모드: 아무 입력 없이도 바로 대시보드로 이동
    const sessionData = {
      id: "test-id",
      email: email || "test@example.com",
      name: "테스트 발표자",
      speakerId: speakerId || "TEST-001",
      eventName: "테스트 행사",
      presentationDate: new Date().toISOString(),
      project_id: "test-project",
      organization: "테스트 기관",
      position: "테스트 직책",
      department: "테스트 부서",
    };

    localStorage.setItem('speakerSession', JSON.stringify(sessionData));
    
    toast.success("로그인 성공!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            발표자 포털
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            국제회의 발표자를 위한 통합 관리 시스템
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-start">
          <div className="space-y-6">
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border bg-card shadow-card hover:shadow-elevated transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              문의사항이 있으시면 주최측 담당자에게 연락해주세요
            </p>
          </div>

          <div className="lg:sticky lg:top-8">
            <Card className="shadow-elevated animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">로그인</CardTitle>
                <CardDescription>
                  발표자 정보를 입력해주세요
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
