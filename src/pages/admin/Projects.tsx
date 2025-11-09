import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Settings, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("프로젝트 목록을 불러오는데 실패했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            project_name: formData.project_name,
            event_name: formData.event_name,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          })
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success("프로젝트가 수정되었습니다.");
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            project_name: formData.project_name,
            event_name: formData.event_name,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          });

        if (error) throw error;
        toast.success("프로젝트가 생성되었습니다.");
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
    });
    setEditingProject(null);
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProject ? "프로젝트 수정" : "새 프로젝트 만들기"}</DialogTitle>
                <DialogDescription>
                  프로젝트 정보를 입력하세요
                </DialogDescription>
              </DialogHeader>
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
                    {editingProject ? "수정" : "생성"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {projects.length === 0 ? (
          <Card className="shadow-elevated">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">등록된 프로젝트가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">새 프로젝트를 만들어보세요.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="shadow-elevated">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{project.project_name}</CardTitle>
                      <CardDescription className="mt-2">
                        {project.event_name}
                      </CardDescription>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                      )}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {project.start_date && new Date(project.start_date).toLocaleDateString('ko-KR')}
                            {project.start_date && project.end_date && ' ~ '}
                            {project.end_date && new Date(project.end_date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                        onClick={() => navigate(`/admin/projects/${project.id}/presentations`)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        발표자료
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
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
