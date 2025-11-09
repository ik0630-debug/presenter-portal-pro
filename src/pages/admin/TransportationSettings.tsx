import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

const AVAILABLE_METHODS = [
  { value: '대중교통', label: '대중교통' },
  { value: '자차', label: '자차' },
  { value: 'KTX', label: 'KTX' },
  { value: '항공', label: '항공' },
  { value: '기타', label: '기타' },
];

const TransportationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [supportedMethods, setSupportedMethods] = useState<string[]>([]);
  const [requiresReceipt, setRequiresReceipt] = useState(true);
  const [receiptDeadline, setReceiptDeadline] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSettings(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error("프로젝트 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('transportation_settings' as any)
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const settings = data as any;
        setSupportedMethods(settings.supported_methods || []);
        setRequiresReceipt(settings.requires_receipt ?? true);
        setReceiptDeadline(settings.receipt_deadline ? new Date(settings.receipt_deadline).toISOString().slice(0, 16) : "");
        setAdditionalNotes(settings.additional_notes || "");
      } else {
        // 기본값 설정
        setSupportedMethods(['대중교통', '자차', 'KTX', '항공', '기타']);
        setRequiresReceipt(true);
        setReceiptDeadline("");
        setAdditionalNotes("");
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error("설정을 불러오는데 실패했습니다.");
    }
  };

  const handleMethodToggle = (method: string) => {
    setSupportedMethods(prev => {
      if (prev.includes(method)) {
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedProject) {
      toast.error("프로젝트를 선택해주세요.");
      return;
    }

    if (supportedMethods.length === 0) {
      toast.error("최소 하나의 교통편을 선택해주세요.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('transportation_settings' as any)
        .upsert({
          project_id: selectedProject,
          supported_methods: supportedMethods,
          requires_receipt: requiresReceipt,
          receipt_deadline: receiptDeadline || null,
          additional_notes: additionalNotes || null,
        });

      if (error) throw error;

      toast.success("교통편 설정이 저장되었습니다.");
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">교통편 설정</h1>
        <p className="text-muted-foreground mt-2">
          발표자에게 제공할 교통편 옵션과 영수증 제출 규정을 설정합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 선택</CardTitle>
          <CardDescription>설정을 적용할 프로젝트를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_name} - {project.event_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>지원하는 교통편</CardTitle>
          <CardDescription>
            발표자가 선택할 수 있는 교통편을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {AVAILABLE_METHODS.map((method) => (
            <div key={method.value} className="flex items-center space-x-2">
              <Checkbox
                id={method.value}
                checked={supportedMethods.includes(method.value)}
                onCheckedChange={() => handleMethodToggle(method.value)}
              />
              <Label htmlFor={method.value} className="cursor-pointer">
                {method.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>영수증 제출 설정</CardTitle>
          <CardDescription>
            교통비 영수증 제출 규정을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_receipt"
              checked={requiresReceipt}
              onCheckedChange={(checked) => setRequiresReceipt(checked as boolean)}
            />
            <Label htmlFor="requires_receipt" className="cursor-pointer">
              영수증 제출 필수
            </Label>
          </div>

          {requiresReceipt && (
            <>
              <div className="space-y-2">
                <Label htmlFor="receipt_deadline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  영수증 제출 마감일
                </Label>
                <Input
                  id="receipt_deadline"
                  type="datetime-local"
                  value={receiptDeadline}
                  onChange={(e) => setReceiptDeadline(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  마감일을 설정하지 않으면 별도 안내 없이 제출 가능합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">
                  추가 안내사항
                </Label>
                <Textarea
                  id="additional_notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="예: 영수증은 발표일 기준 7일 이내 발생한 것만 인정됩니다."
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
};

export default TransportationSettings;
