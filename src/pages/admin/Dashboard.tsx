import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FolderKanban, Users, Settings, Bug } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !adminData) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setAdminEmail(adminData.email);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate("/admin/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃되었습니다.");
    navigate("/admin/login");
  };

  const handleDebugExternalDB = async () => {
    setIsDebugging(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-external-db');
      
      if (error) {
        console.error('Debug error:', error);
        toast.error("디버깅 실행 실패");
        return;
      }
      
      console.log('Debug data:', data);
      setDebugData(data);
      setDebugDialogOpen(true);
      toast.success("외부 DB 디버깅 완료");
    } catch (error: any) {
      console.error('Debug error:', error);
      toast.error("디버깅 중 오류 발생");
    } finally {
      setIsDebugging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              관리자 대시보드
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{adminEmail}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDebugExternalDB}
              disabled={isDebugging}
              className="gap-2"
            >
              <Bug className="h-4 w-4" />
              {isDebugging ? "디버깅 중..." : "외부 DB 디버그"}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="shadow-elevated hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/admin/projects")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <CardTitle>프로젝트 관리</CardTitle>
              <CardDescription>
                프로젝트 생성, 수정, 삭제 및 설정 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                관리하기
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elevated opacity-50">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>발표자 관리</CardTitle>
              <CardDescription>
                발표자 정보 조회 및 관리 (준비 중)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                준비 중
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elevated opacity-50">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>시스템 설정</CardTitle>
              <CardDescription>
                전체 시스템 설정 및 환경 구성 (준비 중)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                준비 중
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 디버그 결과 다이얼로그 */}
      <Dialog open={debugDialogOpen} onOpenChange={setDebugDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>외부 DB 디버그 결과</DialogTitle>
            <DialogDescription>
              외부 Supabase DB의 테이블 구조와 데이터를 확인합니다
            </DialogDescription>
          </DialogHeader>
          
          {debugData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">외부 DB URL:</p>
                <code className="text-xs">{debugData.external_url}</code>
              </div>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Projects 테이블</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Count: {debugData.projects?.count || 0}
                  </p>
                  {debugData.projects?.error && (
                    <p className="text-sm text-destructive mb-2">Error: {debugData.projects.error}</p>
                  )}
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugData.projects?.data, null, 2)}
                  </pre>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Project Speakers 테이블</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Count: {debugData.project_speakers?.count || 0}
                  </p>
                  {debugData.project_speakers?.error && (
                    <p className="text-sm text-destructive mb-2">Error: {debugData.project_speakers.error}</p>
                  )}
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugData.project_speakers?.data, null, 2)}
                  </pre>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Suppliers 테이블</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Count: {debugData.suppliers?.count || 0}
                  </p>
                  {debugData.suppliers?.error && (
                    <p className="text-sm text-destructive mb-2">Error: {debugData.suppliers.error}</p>
                  )}
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugData.suppliers?.data, null, 2)}
                  </pre>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Speaker Sessions 테이블</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Count: {debugData.speaker_sessions?.count || 0}
                  </p>
                  {debugData.speaker_sessions?.error && (
                    <p className="text-sm text-destructive mb-2">Error: {debugData.speaker_sessions.error}</p>
                  )}
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugData.speaker_sessions?.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
