import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            발표자 포털
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            국제회의 발표자를 위한 통합 관리 시스템
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gap-2 text-lg px-8 py-6 shadow-elevated hover:shadow-card transition-all"
          >
            시작하기
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border bg-card shadow-card hover:shadow-elevated transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            문의사항이 있으시면 주최측 담당자에게 연락해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
