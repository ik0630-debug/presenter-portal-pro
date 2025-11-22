import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Speaker {
  id: string;
  speaker_id: string;
  speaker_name: string;
  email: string | null;
  organization: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  project_id: string | null;
}

interface ExternalSpeaker {
  id: string;
  name: string;
  email: string;
  organization?: string;
  department?: string;
  position?: string;
  phone?: string;
}

const Speakers = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [externalSpeakers, setExternalSpeakers] = useState<ExternalSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [formData, setFormData] = useState({
    speaker_name: "",
    email: "",
    organization: "",
    department: "",
    position: "",
    phone: "",
  });

  useEffect(() => {
    fetchSpeakers();
    fetchExternalSpeakers();
  }, [projectId]);

  const fetchSpeakers = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from("speaker_sessions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("연사 목록 조회 실패");
      console.error(error);
    } else {
      setSpeakers(data || []);
    }
    setLoading(false);
  };

  const fetchExternalSpeakers = async () => {
    if (!projectId) return;

    try {
      // 먼저 프로젝트의 external_project_id 가져오기
      const { data: project } = await supabase
        .from("projects")
        .select("external_project_id")
        .eq("id", projectId)
        .single();

      if (!project?.external_project_id) return;

      // 외부 API에서 연사 목록 가져오기
      const { data, error } = await supabase.functions.invoke("get-external-speakers", {
        body: { projectId: project.external_project_id },
      });

      if (error) throw error;

      if (data?.speakers) {
        setExternalSpeakers(data.speakers);
      }
    } catch (error) {
      console.error("외부 연사 목록 조회 실패:", error);
    }
  };

  const handleAddSpeaker = async () => {
    if (!formData.speaker_name) {
      toast.error("이름은 필수 입력 항목입니다.");
      return;
    }

    const { error } = await supabase.from("speaker_sessions").insert({
      project_id: projectId,
      speaker_id: crypto.randomUUID(),
      speaker_name: formData.speaker_name,
      email: formData.email || null,
      organization: formData.organization || null,
      department: formData.department || null,
      position: formData.position || null,
      phone: formData.phone || null,
    });

    if (error) {
      toast.error("연사 추가 실패");
      console.error(error);
    } else {
      toast.success("연사가 추가되었습니다.");
      setDialogOpen(false);
      setFormData({
        speaker_name: "",
        email: "",
        organization: "",
        department: "",
        position: "",
        phone: "",
      });
      fetchSpeakers();
    }
  };

  const handleImportExternalSpeaker = async (externalId: string) => {
    const externalSpeaker = externalSpeakers.find((s) => s.id === externalId);
    if (!externalSpeaker) return;

    const { error } = await supabase.from("speaker_sessions").insert({
      project_id: projectId,
      speaker_id: crypto.randomUUID(),
      external_supplier_id: externalSpeaker.id,
      speaker_name: externalSpeaker.name,
      email: externalSpeaker.email || null,
      organization: externalSpeaker.organization || null,
      department: externalSpeaker.department || null,
      position: externalSpeaker.position || null,
      phone: externalSpeaker.phone || null,
    });

    if (error) {
      toast.error("연사 가져오기 실패");
      console.error(error);
    } else {
      toast.success("연사를 가져왔습니다.");
      setDialogOpen(false);
      fetchSpeakers();
    }
  };

  const handleDeleteSpeaker = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("speaker_sessions").delete().eq("id", id);

    if (error) {
      toast.error("연사 삭제 실패");
      console.error(error);
    } else {
      toast.success("연사가 삭제되었습니다.");
      fetchSpeakers();
    }
  };

  if (loading) {
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">연사 관리</h1>
              <p className="text-sm text-muted-foreground">프로젝트 연사 목록 관리</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>연사 목록</CardTitle>
                <CardDescription>등록된 연사 {speakers.length}명</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsExternal(false)}>
                    <Plus className="h-4 w-4 mr-2" />
                    연사 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>연사 추가</DialogTitle>
                    <DialogDescription>
                      프로젝트에서 불러오거나 직접 입력할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={!isExternal ? "default" : "outline"}
                        onClick={() => setIsExternal(false)}
                        className="flex-1"
                      >
                        직접 입력
                      </Button>
                      <Button
                        variant={isExternal ? "default" : "outline"}
                        onClick={() => setIsExternal(true)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        프로젝트에서 불러오기
                      </Button>
                    </div>

                    {isExternal ? (
                      <div className="space-y-2">
                        <Label>연사 선택</Label>
                        <Select onValueChange={handleImportExternalSpeaker}>
                          <SelectTrigger>
                            <SelectValue placeholder="연사를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {externalSpeakers.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                가져올 연사가 없습니다
                              </div>
                            ) : (
                              externalSpeakers.map((speaker) => (
                                <SelectItem key={speaker.id} value={speaker.id}>
                                  {speaker.name} ({speaker.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>
                            이름 <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={formData.speaker_name}
                            onChange={(e) =>
                              setFormData({ ...formData, speaker_name: e.target.value })
                            }
                            placeholder="홍길동"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>이메일</Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="speaker@example.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>소속</Label>
                          <Input
                            value={formData.organization}
                            onChange={(e) =>
                              setFormData({ ...formData, organization: e.target.value })
                            }
                            placeholder="회사명"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>부서</Label>
                          <Input
                            value={formData.department}
                            onChange={(e) =>
                              setFormData({ ...formData, department: e.target.value })
                            }
                            placeholder="개발팀"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>직함</Label>
                          <Input
                            value={formData.position}
                            onChange={(e) =>
                              setFormData({ ...formData, position: e.target.value })
                            }
                            placeholder="팀장"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>휴대전화</Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="010-1234-5678"
                          />
                        </div>

                        <Button onClick={handleAddSpeaker} className="w-full">
                          추가하기
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {speakers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">등록된 연사가 없습니다.</p>
                <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 연사 추가하기
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>소속</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>직함</TableHead>
                    <TableHead>휴대전화</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakers.map((speaker) => (
                    <TableRow key={speaker.id}>
                      <TableCell className="font-medium">{speaker.speaker_name}</TableCell>
                      <TableCell>{speaker.email || "-"}</TableCell>
                      <TableCell>{speaker.organization || "-"}</TableCell>
                      <TableCell>{speaker.department || "-"}</TableCell>
                      <TableCell>{speaker.position || "-"}</TableCell>
                      <TableCell>{speaker.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSpeaker(speaker.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Speakers;
