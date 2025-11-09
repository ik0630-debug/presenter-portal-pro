import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Loader2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PresentationFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  session_id: string;
  speaker_name: string;
  speaker_email: string;
  organization: string;
  position: string;
  presentation_date: string;
}

const PresentationFiles = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<PresentationFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
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

      // 발표자 세션과 파일 정보 가져오기
      const { data: sessions, error: sessionsError } = await supabase
        .from('speaker_sessions')
        .select('id, speaker_name, email, organization, position, presentation_date')
        .eq('project_id', projectId);

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
        toast.error("발표자 정보를 불러오는데 실패했습니다.");
        return;
      }

      if (!sessions || sessions.length === 0) {
        setFiles([]);
        return;
      }

      // 각 세션의 파일 가져오기
      const sessionIds = sessions.map(s => s.id);
      const { data: presentationFiles, error: filesError } = await supabase
        .from('presentation_files')
        .select('*')
        .in('session_id', sessionIds)
        .order('uploaded_at', { ascending: false });

      if (filesError) {
        console.error('Files error:', filesError);
        toast.error("파일 정보를 불러오는데 실패했습니다.");
        return;
      }

      // 세션 정보와 파일 정보 결합
      const enrichedFiles: PresentationFile[] = (presentationFiles || []).map(file => {
        const session = sessions.find(s => s.id === file.session_id);
        return {
          ...file,
          speaker_name: session?.speaker_name || '',
          speaker_email: session?.email || '',
          organization: session?.organization || '',
          position: session?.position || '',
          presentation_date: session?.presentation_date || '',
        };
      });

      setFiles(enrichedFiles);
    } catch (error) {
      console.error('Load error:', error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: PresentationFile) => {
    setDownloadingId(file.id);
    try {
      const { data, error } = await supabase.storage
        .from('presentations')
        .download(file.file_path);

      if (error) {
        console.error('Download error:', error);
        toast.error("파일 다운로드에 실패했습니다.");
        return;
      }

      // Blob을 URL로 변환하여 다운로드
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("파일 다운로드가 완료되었습니다.");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("파일 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.session_id]) {
      acc[file.session_id] = {
        speaker: {
          name: file.speaker_name,
          email: file.speaker_email,
          organization: file.organization,
          position: file.position,
          presentation_date: file.presentation_date,
        },
        files: [],
      };
    }
    acc[file.session_id].files.push(file);
    return acc;
  }, {} as Record<string, { speaker: any; files: PresentationFile[] }>);

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
                발표자료 관리
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {Object.keys(groupedFiles).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">업로드된 발표자료가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                발표자가 자료를 업로드하면 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFiles).map(([sessionId, data]) => (
              <Card key={sessionId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {data.speaker.name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div>{data.speaker.email}</div>
                        {data.speaker.organization && (
                          <div>
                            {data.speaker.organization}
                            {data.speaker.position && ` · ${data.speaker.position}`}
                          </div>
                        )}
                        {data.speaker.presentation_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            발표 예정: {formatDate(data.speaker.presentation_date)}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {data.files.length}개 파일
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>파일명</TableHead>
                        <TableHead>크기</TableHead>
                        <TableHead>업로드 일시</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {file.file_name}
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(file.file_size)}</TableCell>
                          <TableCell>{formatDate(file.uploaded_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              disabled={downloadingId === file.id}
                            >
                              {downloadingId === file.id ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  다운로드 중...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-3 w-3" />
                                  다운로드
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PresentationFiles;
