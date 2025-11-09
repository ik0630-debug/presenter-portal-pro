import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PresentationField {
  id?: string;
  field_key: string;
  field_label: string;
  field_type: "checkbox" | "text" | "textarea";
  field_description: string;
  is_required: boolean;
  display_order: number;
}

const PresentationFieldSettings = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [fields, setFields] = useState<PresentationField[]>([]);

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
        .from("presentation_fields")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });

      if (existingFields && existingFields.length > 0) {
        setFields(existingFields.map(f => ({
          id: f.id,
          field_key: f.field_key,
          field_label: f.field_label,
          field_type: f.field_type as "checkbox" | "text" | "textarea",
          field_description: f.field_description || "",
          is_required: f.is_required,
          display_order: f.display_order,
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
    const newField: PresentationField = {
      field_key: `custom_field_${Date.now()}`,
      field_label: "",
      field_type: "checkbox",
      field_description: "",
      is_required: false,
      display_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = async (index: number) => {
    const field = fields[index];
    
    if (field.id) {
      const { error } = await supabase
        .from("presentation_fields")
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

  const handleUpdateField = (index: number, updates: Partial<PresentationField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!projectId) return;

    // 필수 필드 검증
    for (const field of fields) {
      if (!field.field_label.trim()) {
        toast.error("모든 필드의 레이블을 입력해주세요.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // 기존 필드 삭제 후 재생성
      const { error: deleteError } = await supabase
        .from("presentation_fields")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // 새로운 필드 저장
      const fieldsToInsert = fields.map((field, index) => ({
        project_id: projectId,
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        field_description: field.field_description,
        is_required: field.is_required,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from("presentation_fields")
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
            <h1 className="text-2xl font-bold">발표 정보 필드 설정</h1>
            <p className="text-muted-foreground">{projectName}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>커스텀 필드 관리</CardTitle>
            <CardDescription>
              발표자가 입력할 추가 정보 필드를 설정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>필드 레이블 *</Label>
                          <Input
                            value={field.field_label}
                            onChange={(e) => handleUpdateField(index, { field_label: e.target.value })}
                            placeholder="예: 추가 장비 필요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>필드 타입</Label>
                          <Select
                            value={field.field_type}
                            onValueChange={(value: "checkbox" | "text" | "textarea") =>
                              handleUpdateField(index, { field_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checkbox">체크박스</SelectItem>
                              <SelectItem value="text">텍스트</SelectItem>
                              <SelectItem value="textarea">긴 텍스트</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>설명</Label>
                        <Textarea
                          value={field.field_description}
                          onChange={(e) => handleUpdateField(index, { field_description: e.target.value })}
                          placeholder="필드에 대한 설명을 입력하세요"
                          rows={2}
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
                          필수 입력
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
              필드 추가
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

export default PresentationFieldSettings;
