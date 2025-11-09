import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PresentationField {
  id: string;
  label: string;
  description: string;
  order: number;
  enabled: boolean;
}

const PresentationInfoSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [fields, setFields] = useState<PresentationField[]>([]);

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

      // 발표 정보 필드 설정 가져오기
      const { data: settingData, error: settingError } = await supabase
        .from('project_settings')
        .select('setting_value')
        .eq('project_id', projectId)
        .eq('setting_key', 'presentation_info_fields')
        .maybeSingle();

      if (settingError) {
        console.error('Setting error:', settingError);
        toast.error("설정을 불러오는데 실패했습니다.");
        return;
      }

      if (settingData?.setting_value) {
        setFields((settingData.setting_value as any[]).sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = () => {
    const newField: PresentationField = {
      id: `custom_${Date.now()}`,
      label: "새 항목",
      description: "설명을 입력하세요",
      order: fields.length + 1,
      enabled: true,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof PresentationField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFields(newFields);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    // 순서 재조정
    newFields.forEach((field, i) => {
      field.order = i + 1;
    });
    setFields(newFields);
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    // 순서 재조정
    newFields.forEach((field, i) => {
      field.order = i + 1;
    });
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('project_settings')
        .upsert([{
          project_id: projectId,
          setting_key: 'presentation_info_fields',
          setting_value: fields as any,
        }], {
          onConflict: 'project_id,setting_key',
        });

      if (error) {
        console.error('Save error:', error);
        toast.error("저장에 실패했습니다.");
        return;
      }

      toast.success("발표 정보 항목이 저장되었습니다.");
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
                발표 정보 항목 설정
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>발표 관련 정보 항목</CardTitle>
            <CardDescription>
              발표자에게 표시될 체크박스 항목을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">항목명</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                          placeholder="예: 동영상 상영"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">ID (수정 불가)</Label>
                        <Input value={field.id} disabled />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">설명</Label>
                      <Input
                        value={field.description}
                        onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                        placeholder="예: 발표에 동영상이 포함되어 있습니다"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) => handleFieldChange(index, 'enabled', checked)}
                        />
                        <Label className="text-sm">활성화</Label>
                      </div>
                      
                      {!field.id.startsWith('use_') && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              항목 추가
            </Button>

            <div className="pt-4 border-t">
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PresentationInfoSettings;
