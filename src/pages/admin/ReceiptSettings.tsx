import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ReceiptSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  
  const [settings, setSettings] = useState({
    deadline_days: 3,
    include_weekends: true,
    custom_deadline: "",
  });

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      // 프로젝트 정보 가져오기
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('project_name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project error:', projectError);
        toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
        return;
      }

      setProjectName(project.project_name);

      // 영수증 마감일 설정 가져오기
      const { data: settingData, error: settingError } = await supabase
        .from('project_settings')
        .select('setting_value')
        .eq('project_id', projectId)
        .eq('setting_key', 'receipt_upload_deadline')
        .maybeSingle();

      if (settingError) {
        console.error('Setting error:', settingError);
        toast.error("설정을 불러오는데 실패했습니다.");
        return;
      }

      if (settingData?.setting_value) {
        const value = settingData.setting_value as any;
        setSettings({
          deadline_days: value.deadline_days || 3,
          include_weekends: value.include_weekends ?? true,
          custom_deadline: value.custom_deadline || "",
        });
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('project_settings')
        .upsert({
          project_id: projectId,
          setting_key: 'receipt_upload_deadline',
          setting_value: {
            deadline_days: settings.deadline_days,
            include_weekends: settings.include_weekends,
            custom_deadline: settings.custom_deadline || null,
          },
        }, {
          onConflict: 'project_id,setting_key',
        });

      if (error) {
        console.error('Save error:', error);
        toast.error("저장에 실패했습니다.");
        return;
      }

      toast.success("영수증 마감일 설정이 저장되었습니다.");
    } catch (error) {
      console.error('Save error:', error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                영수증 마감일 설정
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>영수증 업로드 마감일</CardTitle>
            <CardDescription>
              발표자가 교통비 영수증을 업로드할 수 있는 마감일을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deadline_days">
                  강연 종료 후 업로드 가능 기간 (일)
                </Label>
                <Input
                  id="deadline_days"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.deadline_days}
                  onChange={(e) =>
                    setSettings({ ...settings, deadline_days: parseInt(e.target.value) || 3 })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  강연 종료 후 몇 일 이내에 업로드가 가능한지 설정합니다
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="include_weekends" className="text-base">
                    주말/휴일 포함
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    마감일 계산 시 주말과 휴일을 포함합니다
                  </p>
                </div>
                <Switch
                  id="include_weekends"
                  checked={settings.include_weekends}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, include_weekends: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_deadline">
                  특정 마감일 (선택사항)
                </Label>
                <Input
                  id="custom_deadline"
                  type="datetime-local"
                  value={settings.custom_deadline}
                  onChange={(e) =>
                    setSettings({ ...settings, custom_deadline: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  특정 날짜로 마감일을 지정하려면 입력하세요. 입력 시 위의 기간 설정보다 우선됩니다.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">미리보기</h4>
                <p className="text-sm text-muted-foreground">
                  발표자에게 표시될 안내 문구:
                </p>
                <p className="text-sm font-medium text-destructive">
                  {settings.custom_deadline
                    ? `마감: ${new Date(settings.custom_deadline).toLocaleString('ko-KR')}`
                    : `강연 종료 후 ${settings.deadline_days}일 이내${settings.include_weekends ? '(주말, 휴일 포함)' : '(영업일 기준)'}에 본 포털에 접속하시면 업로드가 가능합니다.`
                  }
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReceiptSettings;
