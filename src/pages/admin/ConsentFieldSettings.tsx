import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ConsentField {
  id?: string;
  field_key: string;
  title: string;
  content: string;
  is_required: boolean;
  display_order: number;
}

const defaultConsentFields: Omit<ConsentField, 'id' | 'display_order'>[] = [
  {
    field_key: "privacy",
    title: "개인정보 수집·이용 동의",
    is_required: true,
    content: `정보 수집자: (주)엠앤씨커뮤니케이션즈

수집하는 정보: 본 시스템을 통해 취득하는 모든 정보 (성명, 소속, 연락처, 발표자료, 서명 등)

수집 및 이용 기간: 수집일로부터 3년

※ 본 동의를 거부하실 수 있으나, 동의하지 않을 경우 행사 참가가 불가합니다.`,
  },
  {
    field_key: "copyright",
    title: "저작권 사용 동의",
    is_required: true,
    content: `본인은 금번 발표자료에 대한 저작권을 주최측에 제공하며, 주최측이 다음의 목적으로 사용하는 것에 동의합니다:

1. 행사 기록 및 홍보물 제작
2. 온라인 배포 및 아카이빙
3. SNS 및 미디어를 통한 공유
4. 향후 관련 행사에서의 참고자료 활용

단, 상업적 목적으로 사용하고자 하는 경우 사전 협의를 통해 진행합니다.`,
  },
  {
    field_key: "portraitRights",
    title: "초상권 사용 동의",
    is_required: true,
    content: `본인은 행사 진행 중 촬영된 사진 및 영상에 대한 초상권을 다음과 같이 제공합니다:

1. 행사 홍보물 및 리포트 제작
2. 공식 웹사이트 및 SNS 게시
3. 언론사 배포 및 보도자료 활용
4. 향후 관련 행사 홍보 활용

본인의 사진 및 영상은 행사의 품격을 유지하는 범위 내에서 사용되며, 부적절한 용도로 사용되지 않을 것을 확인합니다.`,
  },
  {
    field_key: "recording",
    title: "발표 녹음/녹화 동의",
    is_required: true,
    content: `본인은 발표 내용의 녹음 및 녹화에 동의하며, 해당 자료의 활용에 대해 다음과 같이 허락합니다:

1. 행사 참가자에게 다시보기 서비스 제공
2. 온라인 플랫폼을 통한 스트리밍 및 VOD 서비스
3. 교육 및 연구 목적의 활용
4. 행사 하이라이트 영상 제작

녹음/녹화된 자료는 주최측이 관리하며, 개인정보 보호법에 따라 안전하게 보관됩니다.`,
  },
  {
    field_key: "materials",
    title: "자료 배포 동의",
    is_required: false,
    content: `본인은 제출한 발표자료가 행사 참가자들에게 배포되는 것에 동의합니다:

1. 행사 참가자에게 PDF 파일이나 인쇄물 형태로 배포
2. 행사 웹사이트를 통한 다운로드 제공
3. 이메일을 통한 자료 발송
4. 온라인 커뮤니티에서의 공유

배포되는 자료에는 저작권 표시가 포함되며, 상업적 용도의 무단 사용을 금지합니다.`,
  },
];

const ConsentFieldSettings = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [fields, setFields] = useState<ConsentField[]>([]);

  useEffect(() => {
    // 로그인 기능 비활성화 - 추후 재활성화 예정
    // checkAuth();
    loadData();
  }, [projectId]);

  // const checkAuth = async () => {
  //   const { data: { user } } = await supabase.auth.getUser();
  //   if (!user) {
  //     navigate("/admin/login");
  //     return;
  //   }

  //   const { data: adminUser } = await supabase
  //     .from("admin_users")
  //     .select("*")
  //     .eq("user_id", user.id)
  //     .maybeSingle();

  //   if (!adminUser) {
  //     toast.error("관리자 권한이 없습니다.");
  //     navigate("/");
  //   }
  // };

  const loadData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("project_name")
        .eq("id", projectId)
        .single();

      if (project) {
        setProjectName(project.project_name);
      }

      const { data: existingFields } = await supabase
        .from("consent_fields")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (existingFields && existingFields.length > 0) {
        setFields(existingFields.map(f => ({
          id: f.id,
          field_key: f.field_key,
          title: f.title,
          content: f.content,
          is_required: f.is_required,
          display_order: f.display_order,
        })));
      } else {
        // 기본값 설정
        setFields(defaultConsentFields.map((field, index) => ({
          ...field,
          display_order: index,
        })));
      }
    } catch (error) {
      console.error("Load error:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = () => {
    const newField: ConsentField = {
      field_key: `custom_consent_${Date.now()}`,
      title: "",
      content: "",
      is_required: true,
      display_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = async (index: number) => {
    const field = fields[index];
    
    if (field.id) {
      const { error } = await supabase
        .from("consent_fields")
        .delete()
        .eq("id", field.id);

      if (error) {
        toast.error("필드 삭제에 실패했습니다.");
        return;
      }
    }

    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    toast.success("필드가 삭제되었습니다.");
  };

  const handleUpdateField = (index: number, updates: Partial<ConsentField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!projectId) return;

    // 필수 필드 검증
    for (const field of fields) {
      if (!field.title.trim() || !field.content.trim()) {
        toast.error("모든 필드의 제목과 내용을 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // 기존 필드 삭제 후 재생성
      const { error: deleteError } = await supabase
        .from("consent_fields")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // 새로운 필드 저장
      const fieldsToInsert = fields.map((field, index) => ({
        project_id: projectId,
        field_key: field.field_key,
        title: field.title,
        content: field.content,
        is_required: field.is_required,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from("consent_fields")
        .insert(fieldsToInsert);

      if (insertError) throw insertError;

      toast.success("설정이 저장되었습니다.");
      loadData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/projects`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">동의서 설정</h1>
            <p className="text-muted-foreground">{projectName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>동의서 항목 관리</CardTitle>
            <CardDescription>
              발표자가 동의할 항목을 설정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>동의 제목 *</Label>
                        <Input
                          value={field.title}
                          onChange={(e) => handleUpdateField(index, { title: e.target.value })}
                          placeholder="예: 저작권 사용 동의"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>동의 내용 *</Label>
                        <Textarea
                          value={field.content}
                          onChange={(e) => handleUpdateField(index, { content: e.target.value })}
                          placeholder="동의 내용을 입력하세요"
                          rows={8}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`required-${index}`}
                          checked={field.is_required}
                          onCheckedChange={(checked) =>
                            handleUpdateField(index, { is_required: checked as boolean })
                          }
                        />
                        <Label htmlFor={`required-${index}`} className="cursor-pointer">
                          필수 동의
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddField}
            >
              <Plus className="h-4 w-4 mr-2" />
              동의 항목 추가
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/admin/projects`)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsentFieldSettings;
