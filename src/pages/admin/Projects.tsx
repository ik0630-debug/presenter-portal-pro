import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Settings, FileText, Clock, ListChecks, FileCheck, MapPinned, Download, Users, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  title?: string;
  project_name: string;
  event_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  external_project_id: string | null;
  slug: string | null;
  speakers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface ExternalProject {
  id: string;
  title?: string;
  project_name: string;
  event_name?: string;
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
  const [isSyncing, setIsSyncing] = useState(false);
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
    slug: "",
    is_active: true,
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
      console.log('Fetching projects from local DB...');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Local projects:', data);
      setProjects(data || []);
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
      // 자동으로 slug 생성
      const autoSlug = selectedProject.project_name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // 외부 앱의 프로젝트명 = 이 앱의 행사명
      setFormData({
        project_name: selectedProject.project_name,
        event_name: selectedProject.project_name, // 외부의 프로젝트명을 행사명으로
        description: selectedProject.description || "",
        start_date: selectedProject.start_date?.split('T')[0] || "",
        end_date: selectedProject.end_date?.split('T')[0] || "",
        slug: autoSlug,
        is_active: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // slug 유효성 검사
      if (!formData.slug) {
        toast.error("프로젝트 경로(slug)를 입력해주세요.");
        return;
      }

      // slug 중복 체크
      if (!editingProject) {
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', formData.slug)
          .maybeSingle();

        if (existingProject) {
          toast.error("이미 사용중인 경로입니다. 다른 경로를 입력해주세요.");
          return;
        }
      }

      if (editingProject) {
        // 로컬 프로젝트 수정
        const { error } = await supabase
          .from('projects')
          .update({
            project_name: formData.project_name,
            event_name: formData.event_name,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            slug: formData.slug,
            is_active: formData.is_active,
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success("프로젝트 설정이 저장되었습니다.");
      } else {
        if (createMode === "import" && selectedExternalProjectId) {
          // 외부 프로젝트 가져오기
          const { error } = await supabase.from('projects').insert({
            project_name: formData.project_name,
            event_name: formData.event_name, // 외부 프로젝트명을 행사명으로
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            external_project_id: selectedExternalProjectId,
            slug: formData.slug,
            is_active: true,
          });

          if (error) throw error;
          toast.success("외부 프로젝트를 가져왔습니다.");
        } else {
          // 새 로컬 프로젝트 생성
          const { error } = await supabase.from('projects').insert({
            project_name: formData.project_name,
            event_name: formData.event_name,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            slug: formData.slug,
            is_active: true,
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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProject.id);

      if (error) throw error;
      
      toast.success("프로젝트가 삭제되었습니다.");
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
      slug: "",
      is_active: true,
    });
    setEditingProject(null);
    setSelectedExternalProjectId("");
    setCreateMode("import");
  };

  const handleSyncProjects = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-projects');
      
      if (error) throw error;

      toast.success(`동기화 완료: ${data.newProjects}개 신규, ${data.updatedProjects}개 업데이트`);
      fetchProjects();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || "프로젝트 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    
    // 사용 시작일: 기존 값이 있으면 유지, 없으면 오늘
    const today = new Date().toISOString().split('T')[0];
    const startDate = project.start_date ? project.start_date.split('T')[0] : today;
    
    // 사용 종료일: 기존 값이 있으면 유지, 없으면 행사 종료일 + 10일
    let endDate = today;
    if (project.end_date) {
      endDate = project.end_date.split('T')[0];
    }
    
    setFormData({
      project_name: project.project_name,
      event_name: project.event_name,
      description: project.description || "",
      start_date: startDate,
      end_date: endDate,
      slug: project.slug || "",
      is_active: project.is_active,
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
            <Button 
              variant="outline" 
              onClick={handleSyncProjects}
              disabled={isSyncing}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isSyncing ? "동기화 중..." : "자동 동기화"}
            </Button>
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
                <DialogTitle>{editingProject ? "프로젝트 설정" : "새 프로젝트 만들기"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "페이지 주소와 사용 기간을 설정하세요" : "외부 프로젝트에서 가져오거나 직접 생성하세요"}
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
                                {project.project_name || '제목 없음'}
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
                      <div className="space-y-2">
                        <Label htmlFor="slug">프로젝트 경로 (URL) *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                          placeholder="ai-conference-2024"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          발표자 링크: {window.location.origin}/{formData.slug || '{경로}'}/{'발표자이메일'}
                        </p>
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
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm">프로젝트 정보</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_project_name">프로젝트명</Label>
                        <Input
                          id="edit_project_name"
                          value={formData.project_name}
                          disabled
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_event_name">행사명</Label>
                        <Input
                          id="edit_event_name"
                          value={formData.event_name}
                          disabled
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_slug">
                        페이지 주소 * 
                        <span className="text-xs text-muted-foreground ml-2">
                          (예: my-event → presenter-portal-pro.lovable.app/my-event)
                        </span>
                      </Label>
                      <Input
                        id="edit_slug"
                        value={formData.slug}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');
                          setFormData({...formData, slug});
                        }}
                        placeholder="my-event-2024"
                        required
                      />
                      {formData.slug && (
                        <p className="text-xs text-muted-foreground">
                          발표자 접속 주소: https://presenter-portal-pro.lovable.app/{formData.slug}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_description">설명</Label>
                      <Textarea
                        id="edit_description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        placeholder="프로젝트에 대한 설명을 입력하세요"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_start_date">
                          사용 시작일 *
                          <span className="text-xs text-muted-foreground ml-2">(오늘부터 시작)</span>
                        </Label>
                        <Input
                          id="edit_start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_end_date">
                          사용 종료일 *
                          <span className="text-xs text-muted-foreground ml-2">(행사일 + 10일)</span>
                        </Label>
                        <Input
                          id="edit_end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_is_active">활성화 상태 *</Label>
                      <Select 
                        value={formData.is_active ? "active" : "inactive"} 
                        onValueChange={(value) => setFormData({...formData, is_active: value === "active"})}
                      >
                        <SelectTrigger id="edit_is_active">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">활성 (발표자 접속 가능)</SelectItem>
                          <SelectItem value="inactive">비활성 (발표자 접속 불가)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {formData.is_active 
                          ? "✅ 발표자가 페이지에 접속할 수 있습니다." 
                          : "⚠️ 발표자가 페이지에 접속할 수 없습니다."}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit">
                      저장
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
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Card key={project.id} className="shadow-card hover:shadow-elevated transition-all duration-200 overflow-hidden group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg leading-tight">{project.event_name || project.project_name || project.title || '제목 없음'}</CardTitle>
                          {project.external_project_id && (
                            <Badge variant="secondary" className="gap-1">
                              <ExternalLink className="h-3 w-3" />
                              외부 연동
                            </Badge>
                          )}
                          {!project.is_active && (
                            <Badge variant="outline">비활성</Badge>
                          )}
                        </div>
                        
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '날짜 미정'}
                              {project.start_date && project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`}
                            </span>
                          </div>
                          {project.speakers?.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              <span>{project.speakers.length}명</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="프로젝트 설정"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteProject(project)}
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    {/* 발표자 링크 */}
                    {project.slug && (
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs flex-1 truncate">
                            /{project.slug}/발표자이메일
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/${project.slug}/`);
                              toast.success("발표자 링크가 복사되었습니다");
                            }}
                            className="h-7 px-2 gap-1.5 shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                            복사
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 설정 버튼 그리드 */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/transportation`)}
                        className="justify-start gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        교통비
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/receipt-settings`)}
                        className="justify-start gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        마감일
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/presentation-fields`)}
                        className="justify-start gap-2"
                      >
                        <ListChecks className="h-4 w-4" />
                        발표정보
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/consent-fields`)}
                        className="justify-start gap-2"
                      >
                        <FileCheck className="h-4 w-4" />
                        동의서
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/arrival-guide`)}
                        className="justify-start gap-2"
                      >
                        <MapPinned className="h-4 w-4" />
                        현장안내
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/presentations`)}
                        className="justify-start gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        발표자료
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
