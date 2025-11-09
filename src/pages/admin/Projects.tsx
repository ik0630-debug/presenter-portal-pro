import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Settings, FileText, Clock, ListChecks, FileCheck, MapPinned, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  project_name: string;
  event_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ExternalProject {
  id: string;
  project_name: string;
  event_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  speakers: Array<{
    id: string;
    name: string;
    email: string;
    presentation_topic?: string;
  }>;
}

const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [externalProjects, setExternalProjects] = useState<ExternalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [selectedExternalProjectId, setSelectedExternalProjectId] = useState<string>("");
  const [createMode, setCreateMode] = useState<"import" | "manual">("import");
  
  const [formData, setFormData] = useState({
    project_name: "",
    event_name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    checkAuth();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (isDialogOpen && !editingProject) {
      fetchExternalProjectsForDialog();
    }
  }, [isDialogOpen, editingProject]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      navigate("/admin/login");
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-external-projects');

      if (error) throw error;
      
      setProjects(data?.projects || []);
    } catch (error: any) {
      toast.error("프로젝트 목록을 불러오는데 실패했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExternalProjectsForDialog = async () => {
    setIsLoadingExternal(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-external-projects');

      if (error) throw error;
      
      console.log('External projects:', data);
      setExternalProjects(data?.projects || []);
    } catch (error: any) {
      toast.error("외부 프로젝트를 불러오는데 실패했습니다.");
      console.error(error);
    } finally {
      setIsLoadingExternal(false);
    }
  };

  const handleExternalProjectSelect = (projectId: string) => {
    setSelectedExternalProjectId(projectId);
    const selectedProject = externalProjects.find(p => p.id === projectId);
    if (selectedProject) {
      setFormData({
        project_name: selectedProject.project_name,
        event_name: selectedProject.event_name,
        description: selectedProject.description || "",
        start_date: selectedProject.start_date?.split('T')[0] || "",
        end_date: selectedProject.end_date?.split('T')[0] || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProject) {
        const { data, error } = await supabase.functions.invoke('update-external-project', {
          body: {
            id: editingProject.id,
            project_name: formData.project_name,
            event_name: formData.event_name,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          }
        });

        if (error) throw error;
        toast.success("프로젝트가 수정되었습니다.");
      } else {
        // Import or create based on mode
        if (createMode === "import" && selectedExternalProjectId) {
          // Just confirm - project already exists in external DB
          toast.success("외부 프로젝트를 가져왔습니다.");
        } else {
          const { data, error } = await supabase.functions.invoke('create-external-project', {
            body: {
              project_name: formData.project_name,
              event_name: formData.event_name,
              description: formData.description || null,
              start_date: formData.start_date || null,
              end_date: formData.end_date || null,
            }
          });

          if (error) throw error;
          toast.success("프로젝트가 생성되었습니다.");
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "작업 중 오류가 발생했습니다.");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;

    try {
      // 로컬 DB에서만 삭제 (외부 원본 DB는 유지)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProject.id);

      if (error) throw error;
      
      toast.success("프로젝트가 삭제되었습니다. (원본 데이터는 유지됩니다)");
      setDeleteProject(null);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "삭제 중 오류가 발생했습니다.");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: "",
      event_name: "",
      description: "",
      start_date: "",
      end_date: "",
    });
    setEditingProject(null);
    setSelectedExternalProjectId("");
    setCreateMode("import");
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      event_name: project.event_name,
      description: project.description || "",
      start_date: project.start_date?.split('T')[0] || "",
      end_date: project.end_date?.split('T')[0] || "",
    });
    setIsDialogOpen(true);
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              프로젝트 관리
            </h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 프로젝트
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "프로젝트 수정" : "새 프로젝트 만들기"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "프로젝트 정보를 수정하세요" : "외부 프로젝트에서 가져오거나 직접 생성하세요"}
                </DialogDescription>
              </DialogHeader>

              {!editingProject && (
                <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "import" | "manual")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="import">외부 프로젝트 가져오기</TabsTrigger>
                    <TabsTrigger value="manual">직접 생성</TabsTrigger>
                  </TabsList>

                  <TabsContent value="import" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>외부 프로젝트 선택</Label>
                      {isLoadingExternal ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">프로젝트 목록을 불러오는 중...</p>
                        </div>
                      ) : (
                        <Select value={selectedExternalProjectId} onValueChange={handleExternalProjectSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="프로젝트를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {externalProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.project_name} - {project.event_name}
                                {project.start_date && ` (${new Date(project.start_date).toLocaleDateString('ko-KR')})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {selectedExternalProjectId && (
                      <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                        <h4 className="font-semibold">선택된 프로젝트 정보</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">프로젝트명:</span> {formData.project_name}</p>
                          <p><span className="text-muted-foreground">행사명:</span> {formData.event_name}</p>
                          {formData.description && <p><span className="text-muted-foreground">설명:</span> {formData.description}</p>}
                          {formData.start_date && <p><span className="text-muted-foreground">시작일:</span> {new Date(formData.start_date).toLocaleDateString('ko-KR')}</p>}
                          {formData.end_date && <p><span className="text-muted-foreground">종료일:</span> {new Date(formData.end_date).toLocaleDateString('ko-KR')}</p>}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        취소
                      </Button>
                      <Button 
                        onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }}
                        disabled={!selectedExternalProjectId}
                      >
                        가져오기
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="project_name">프로젝트명 *</Label>
                          <Input
                            id="project_name"
                            value={formData.project_name}
                            onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event_name">행사명 *</Label>
                          <Input
                            id="event_name"
                            value={formData.event_name}
                            onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_date">시작일</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_date">종료일</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          취소
                        </Button>
                        <Button type="submit">
                          생성
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              )}

              {editingProject && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project_name">프로젝트명 *</Label>
                      <Input
                        id="project_name"
                        value={formData.project_name}
                        onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_name">행사명 *</Label>
                      <Input
                        id="event_name"
                        value={formData.event_name}
                        onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">시작일</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">종료일</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit">
                      수정
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* 등록된 프로젝트 섹션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">등록된 프로젝트</h2>
          {projects.length === 0 ? (
            <Card className="shadow-elevated">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">등록된 프로젝트가 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">새 프로젝트를 만들거나 외부 프로젝트를 동기화하세요.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
              <Collapsible key={project.id}>
                <Card className="shadow-elevated overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                            <CardTitle className="text-xl">{project.project_name}</CardTitle>
                          </div>
                          <div className="ml-7 mt-2 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{project.event_name}</Badge>
                              {project.description && (
                                <Badge variant="outline">{project.description}</Badge>
                              )}
                            </div>
                            {(project.start_date || project.end_date) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {project.start_date && new Date(project.start_date).toLocaleDateString('ko-KR')}
                                  {project.start_date && project.end_date && ' ~ '}
                                  {project.end_date && new Date(project.end_date).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(project);
                            }}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteProject(project);
                            }}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-6">
                      <div className="ml-7 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-4">발주: 포항시</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/transportation`)}
                            className="gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            교통비 설정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/receipt-settings`)}
                            className="gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            마감일 설정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/presentation-fields`)}
                            className="gap-2"
                          >
                            <ListChecks className="h-4 w-4" />
                            발표 정보 필드
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/consent-fields`)}
                            className="gap-2"
                          >
                            <FileCheck className="h-4 w-4" />
                            동의서 설정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/arrival-guide`)}
                            className="gap-2"
                          >
                            <MapPinned className="h-4 w-4" />
                            현장안내 설정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}/presentations`)}
                            className="gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            발표자료
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{deleteProject?.project_name}' 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProjects;
