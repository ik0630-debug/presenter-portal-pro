import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Video, Volume2, Laptop, FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SpeakerInfo {
  id: string;
  speaker_name: string;
  email: string;
  organization: string | null;
  position: string | null;
  department: string | null;
  presentation_date: string | null;
}

interface PresentationInfo {
  session_id: string;
  use_video: boolean;
  use_audio: boolean;
  use_personal_laptop: boolean;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

interface CombinedInfo extends SpeakerInfo {
  presentation_info: PresentationInfo | null;
}

const SpeakerPresentationInfo = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [speakers, setSpeakers] = useState<CombinedInfo[]>([]);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    checkAuthAndLoadData();
  }, [projectId]);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate("/admin/login");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!projectId) {
        toast.error("프로젝트 ID가 없습니다.");
        return;
      }

      // 프로젝트 정보 로드
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('project_name, event_name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project error:', projectError);
        toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
        return;
      }

      setProjectName(project.project_name);

      // 발표자 정보 로드
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('speaker_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('speaker_name');

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
        toast.error("발표자 정보를 불러오는데 실패했습니다.");
        return;
      }

      // 각 발표자의 presentation_info 로드
      const speakersWithInfo = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: presentationInfo } = await supabase
            .from('presentation_info')
            .select('*')
            .eq('session_id', session.id)
            .maybeSingle();

          return {
            ...session,
            presentation_info: presentationInfo,
          };
        })
      );

      setSpeakers(speakersWithInfo);
    } catch (error) {
      console.error('Load error:', error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ enabled }: { enabled: boolean }) => (
    enabled ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-muted-foreground" />
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                발표 정보 확인
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              발표자별 발표 정보
            </CardTitle>
            <CardDescription>
              각 발표자의 발표 관련 정보를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {speakers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                등록된 발표자가 없습니다.
              </div>
            ) : (
              <div className="space-y-6">
                {speakers.map((speaker) => (
                  <div key={speaker.id} className="border rounded-lg p-6 space-y-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{speaker.speaker_name}</h3>
                        <p className="text-sm text-muted-foreground">{speaker.email}</p>
                        {speaker.organization && (
                          <p className="text-sm text-muted-foreground">
                            {speaker.organization}
                            {speaker.department && ` · ${speaker.department}`}
                            {speaker.position && ` · ${speaker.position}`}
                          </p>
                        )}
                        {speaker.presentation_date && (
                          <p className="text-sm text-muted-foreground">
                            발표 일정: {new Date(speaker.presentation_date).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                      {speaker.presentation_info ? (
                        <Badge variant="default">정보 제출 완료</Badge>
                      ) : (
                        <Badge variant="secondary">미제출</Badge>
                      )}
                    </div>

                    <Separator />

                    {speaker.presentation_info ? (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Video className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">동영상 사용</p>
                              <p className="text-xs text-muted-foreground">발표에 동영상 포함</p>
                            </div>
                            <StatusIcon enabled={speaker.presentation_info.use_video} />
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Volume2 className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">소리 사용</p>
                              <p className="text-xs text-muted-foreground">발표에 오디오 포함</p>
                            </div>
                            <StatusIcon enabled={speaker.presentation_info.use_audio} />
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Laptop className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">개인 노트북</p>
                              <p className="text-xs text-muted-foreground">개인 노트북 사용</p>
                            </div>
                            <StatusIcon enabled={speaker.presentation_info.use_personal_laptop} />
                          </div>
                        </div>

                        {speaker.presentation_info.special_requests && (
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-2">특별 요청사항</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {speaker.presentation_info.special_requests}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            제출일: {new Date(speaker.presentation_info.created_at).toLocaleString('ko-KR')}
                          </span>
                          {speaker.presentation_info.updated_at !== speaker.presentation_info.created_at && (
                            <span>
                              최종 수정: {new Date(speaker.presentation_info.updated_at).toLocaleString('ko-KR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>아직 발표 정보를 제출하지 않았습니다.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SpeakerPresentationInfo;
