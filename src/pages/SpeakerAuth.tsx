import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Shield, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SpeakerAuth = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        toast.error("프로젝트를 찾을 수 없습니다.");
        navigate('/');
        return;
      }

      // 사용 기간 체크
      const now = new Date();
      const startDate = data.start_date ? new Date(data.start_date) : null;
      const endDate = data.end_date ? new Date(data.end_date) : null;

      if (startDate && now < startDate) {
        toast.error("아직 접속 가능한 기간이 아닙니다.");
        navigate('/');
        return;
      }

      if (endDate && now > endDate) {
        toast.error("접속 가능한 기간이 종료되었습니다.");
        navigate('/');
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error("오류가 발생했습니다.");
      navigate('/');
    } finally {
      setIsLoadingProject(false);
    }
  };

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
    
    if (!email) {
      toast.error("이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 발표자 세션 확인
      const { data, error } = await supabase.functions.invoke('get-speaker-session', {
        body: { 
          email,
          project_id: project.id
        }
      });

      if (error) throw error;

      if (!data.session) {
        toast.error("등록된 발표자 정보를 찾을 수 없습니다.");
        return;
      }

      // 세션 저장
      localStorage.setItem('speakerSession', JSON.stringify(data.session));
      
      toast.success("로그인 성공!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {project.event_name || project.project_name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            발표자 포털에 오신 것을 환영합니다
          </p>
          {project.description && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {project.description}
            </p>
          )}
          {(project.start_date || project.end_date) && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                행사 기간: {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}
                {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('ko-KR')}`}
              </span>
            </div>
          )}
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
                <CardTitle className="text-2xl font-bold">발표자 로그인</CardTitle>
                <CardDescription>
                  등록하신 이메일 주소를 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 주소</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="speaker@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "확인 중..." : "로그인"}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>등록하신 이메일 주소로 로그인할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerAuth;
