import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, X, Calendar, Plus, Loader2, Trash2, Star, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  file?: File; // 새로 선택한 파일
  uploadDate: string;
  isSelected: boolean;
  id?: string; // DB에서 로드된 파일의 경우
  filePath?: string; // Storage 경로
  fileName?: string; // DB의 파일명
  fileSize?: number; // DB의 파일 크기
  isPrimary?: boolean; // 우선 송출 파일 여부
}

interface SavedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  is_primary: boolean;
}

const PresentationUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const deadline = "2024-12-31 23:59";
  
  // 발표 관련 정보 상태
  const [presentationFields, setPresentationFields] = useState<any[]>([]);
  const [presentationInfo, setPresentationInfo] = useState<Record<string, boolean>>({});
  const [specialRequirements, setSpecialRequirements] = useState("");

  // 세션 정보 및 기존 데이터 로드
  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    setIsLoading(true);
    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("로그인 정보를 찾을 수 없습니다.");
        return;
      }

      // speaker_sessions에서 세션 정보 가져오기
      const { data: session, error: sessionError } = await supabase
        .from('speaker_sessions')
        .select('id, project_id')
        .eq('email', user.email)
        .maybeSingle();

      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error("세션 정보를 불러오는데 실패했습니다.");
        return;
      }

      if (!session) {
        toast.error("발표자 세션을 찾을 수 없습니다.");
        return;
      }

      setSessionId(session.id);

      // 프로젝트 설정에서 발표 정보 필드 가져오기
      const { data: fieldsSettings } = await supabase
        .from('project_settings')
        .select('setting_value')
        .eq('project_id', session.project_id)
        .eq('setting_key', 'presentation_info_fields')
        .maybeSingle();

      // 기본 필드 정의
      const defaultFields = [
        { id: 'use_video', label: '동영상 사용', description: '발표에 동영상이 포함되어 있습니다', order: 1, enabled: true },
        { id: 'use_audio', label: '소리 사용', description: '발표에 오디오가 포함되어 있습니다', order: 2, enabled: true },
        { id: 'use_personal_laptop', label: '개인 노트북 사용', description: '개인 노트북을 사용하여 발표합니다', order: 3, enabled: true },
      ];

      if (fieldsSettings?.setting_value) {
        // 설정된 커스텀 필드 중 enabled=true인 것만 가져오기
        const customFields = (fieldsSettings.setting_value as any[])
          .filter(f => f.enabled && !['use_video', 'use_audio', 'use_personal_laptop'].includes(f.id));
        
        // 기본 필드 + 커스텀 필드를 합치고 순서대로 정렬
        const allFields = [...defaultFields, ...customFields].sort((a, b) => a.order - b.order);
        setPresentationFields(allFields);
        
        // 초기 상태 설정
        const initialState: Record<string, boolean> = {};
        allFields.forEach(field => {
          initialState[field.id] = false;
        });
        setPresentationInfo(initialState);
      } else {
        // 설정이 없으면 기본 필드만 표시
        setPresentationFields(defaultFields);
        const initialState: Record<string, boolean> = {};
        defaultFields.forEach(field => {
          initialState[field.id] = false;
        });
        setPresentationInfo(initialState);
      }

      // 발표 정보 로드
      const { data: info, error: infoError } = await supabase
        .from('presentation_info')
        .select('*')
        .eq('session_id', session.id)
        .maybeSingle();

      if (infoError) {
        console.error('Info error:', infoError);
      } else if (info) {
        const loadedInfo: Record<string, boolean> = {};
        presentationFields.forEach(field => {
          loadedInfo[field.id] = info[field.id] || false;
        });
        setPresentationInfo(loadedInfo);
        setSpecialRequirements(info.special_requests || "");
      }

      // 업로드된 파일 목록 로드
      const { data: files, error: filesError } = await supabase
        .from('presentation_files')
        .select('*')
        .eq('session_id', session.id)
        .order('uploaded_at', { ascending: false });

      if (filesError) {
        console.error('Files error:', filesError);
      } else if (files) {
        setSavedFiles(files as SavedFile[]);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("파일 크기는 100MB를 초과할 수 없습니다.");
        return;
      }
      
      const newFile: UploadedFile = {
        file,
        uploadDate: new Date().toLocaleString("ko-KR"),
        isSelected: savedFiles.length === 0 && uploadedFiles.length === 0, // 첫 파일은 자동으로 선택
      };
      
      setUploadedFiles([...uploadedFiles, newFile]);
      toast.success("파일이 선택되었습니다.");
    }
    // Reset input
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("업로드할 파일을 선택해주세요.");
      return;
    }

    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없습니다.");
      return;
    }

    setIsUploading(true);
    try {
      // 각 파일을 Storage에 업로드하고 DB에 저장
      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];
        if (!uploadedFile.file) continue; // 파일이 없으면 건너뛰기

        const file = uploadedFile.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${sessionId}_${Date.now()}.${fileExt}`;
        const filePath = `${sessionId}/${fileName}`;

        // Storage에 파일 업로드
        const { error: uploadError } = await supabase.storage
          .from('presentations')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`${file.name} 업로드 실패: ${uploadError.message}`);
          continue;
        }

        // DB에 파일 정보 저장 (우선 송출 파일 정보 포함)
        const { error: dbError } = await supabase
          .from('presentation_files')
          .insert({
            session_id: sessionId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            is_primary: uploadedFile.isSelected, // 우선 송출 파일 여부 저장
          });

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error(`${file.name} 정보 저장 실패`);
          
          // DB 저장 실패시 업로드된 파일 삭제
          await supabase.storage
            .from('presentations')
            .remove([filePath]);
          continue;
        }
      }

      toast.success("발표자료가 업로드되었습니다.");
      
      // 파일 목록 초기화 및 재로드
      setUploadedFiles([]);
      await loadSessionData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    // 첫 번째 파일이 삭제되었고 남은 파일이 있으면 새로운 첫 번째 파일을 선택
    if (uploadedFiles[index].isSelected && newFiles.length > 0) {
      newFiles[0].isSelected = true;
    }
    setUploadedFiles(newFiles);
    toast.info("파일이 제거되었습니다.");
  };

  const handleDeleteSavedFile = async (file: SavedFile) => {
    if (!confirm(`'${file.file_name}' 파일을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(file.id);
    try {
      // Storage에서 파일 삭제
      const { error: storageError } = await supabase.storage
        .from('presentations')
        .remove([file.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        toast.error("파일 삭제에 실패했습니다.");
        return;
      }

      // DB에서 파일 정보 삭제
      const { error: dbError } = await supabase
        .from('presentation_files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error('DB delete error:', dbError);
        toast.error("파일 정보 삭제에 실패했습니다.");
        return;
      }

      // 로컬 상태 업데이트
      setSavedFiles(savedFiles.filter(f => f.id !== file.id));
      toast.success("파일이 삭제되었습니다.");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("파일 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePrimary = async (file: SavedFile) => {
    try {
      // 모든 파일의 is_primary를 false로 설정
      const { error: resetError } = await supabase
        .from('presentation_files')
        .update({ is_primary: false })
        .eq('session_id', sessionId);

      if (resetError) {
        console.error('Reset error:', resetError);
        toast.error("우선 송출 파일 설정에 실패했습니다.");
        return;
      }

      // 선택한 파일을 is_primary = true로 설정
      const { error: updateError } = await supabase
        .from('presentation_files')
        .update({ is_primary: true })
        .eq('id', file.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error("우선 송출 파일 설정에 실패했습니다.");
        return;
      }

      // 로컬 상태 업데이트
      setSavedFiles(savedFiles.map(f => ({
        ...f,
        is_primary: f.id === file.id,
      })));

      toast.success("우선 송출 파일이 변경되었습니다.");
    } catch (error) {
      console.error('Toggle primary error:', error);
      toast.error("우선 송출 파일 설정 중 오류가 발생했습니다.");
    }
  };

  const handleDownloadFile = async (file: SavedFile) => {
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
    }
  };

  const handleToggleSelection = (index: number) => {
    const newFiles = uploadedFiles.map((f, i) => ({
      ...f,
      isSelected: i === index,
    }));
    setUploadedFiles(newFiles);
  };

  const handlePresentationInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 기존 정보가 있는지 확인
      const { data: existing } = await supabase
        .from('presentation_info')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      const infoData = {
        session_id: sessionId,
        ...presentationInfo,
        special_requests: specialRequirements,
      };

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('presentation_info')
          .update(infoData)
          .eq('id', existing.id);

        if (error) {
          console.error('Update error:', error);
          toast.error("발표 정보 저장에 실패했습니다.");
          return;
        }
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('presentation_info')
          .insert(infoData);

        if (error) {
          console.error('Insert error:', error);
          toast.error("발표 정보 저장에 실패했습니다.");
          return;
        }
      }

      toast.success("발표 정보가 저장되었습니다.");
    } catch (error) {
      console.error('Save error:', error);
      toast.error("발표 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-accent" />
            마감 일정
          </CardTitle>
          <CardDescription>
            최종 제출 마감: <span className="font-semibold text-accent">{deadline}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">발표자료 업로드</CardTitle>
          <CardDescription className="space-y-2">
            <p>• PPT 등의 파일을 이용하시는 경우, 폰트깨짐 등의 상황에 대비하여 PDF 파일을 함께 업로드 해주시기 바랍니다.</p>
            <p>• 맥(MAC)을 사용하시는 경우 발표자료는 PDF로 업로드 해 주시기 바라며, 현장에 개인 맥북을 지참해 주시기 바랍니다.</p>
            <p>• 여러 파일을 업로드 하시는 경우 우선적으로 송출할 파일을 선택해 주시기 바랍니다.</p>
            <p>• 지원 형식: PPT(PPTX), PDF, DOC(DOCX), HWP(HWPX), ZIP (최대 100MB)</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 업로드된 파일 목록 */}
          {savedFiles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">업로드된 파일</Label>
              {savedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                  <Checkbox
                    checked={file.is_primary}
                    onCheckedChange={() => handleTogglePrimary(file)}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        업로드: {new Date(file.uploaded_at).toLocaleString('ko-KR')}
                      </p>
                      {file.is_primary && (
                        <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          우선 송출 파일
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadFile(file)}
                      title="다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSavedFile(file)}
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === file.id}
                      title="삭제"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 새 파일 선택 영역 */}
          {uploadedFiles.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                파일을 선택하여 업로드하세요
              </p>
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <span>파일 선택</span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".ppt,.pptx,.pdf,.doc,.docx,.hwp,.hwpx,.zip"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">선택한 파일 (업로드 대기 중)</Label>
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-primary/5">
                  <Checkbox
                    checked={uploadedFile.isSelected}
                    onCheckedChange={() => handleToggleSelection(index)}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadedFile.file?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {uploadedFile.file ? (uploadedFile.file.size / (1024 * 1024)).toFixed(2) : 0} MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        업로드: {uploadedFile.uploadDate}
                      </p>
                      {uploadedFile.isSelected && (
                        <p className="text-xs text-destructive font-medium mt-1">
                          우선 송출 파일
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <label htmlFor="file-add" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      파일 추가
                    </span>
                  </Button>
                </label>
                <input
                  id="file-add"
                  type="file"
                  className="hidden"
                  accept=".ppt,.pptx,.pdf,.doc,.docx,.hwp,.hwpx,.zip"
                  onChange={handleFileChange}
                />
                <Button onClick={handleUpload} className="flex-1" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    "업로드"
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 마감 시간까지 자유롭게 수정 가능합니다</p>
            {savedFiles.length > 0 && (
              <p>• 체크박스로 우선 송출할 파일을 선택할 수 있습니다</p>
            )}
            {uploadedFiles.length > 0 && (
              <p>• 여러 파일을 선택한 경우 체크박스로 송출할 파일을 지정하세요</p>
            )}
            <p>• 최대 파일 크기: 100MB</p>
          </div>
        </CardContent>
      </Card>

      {/* 발표 관련 정보 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">발표 관련 정보</CardTitle>
          <CardDescription>
            발표 자료는 별도의 콘솔데스크에서 송출해 드리며, 발표자께는 화면 전환을 위한 클리커(포인터)가 제공됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePresentationInfoSubmit} className="space-y-6">
            <div className="space-y-4">
              {presentationFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <Checkbox
                    id={field.id}
                    checked={presentationInfo[field.id] || false}
                    onCheckedChange={(checked) =>
                      setPresentationInfo({ ...presentationInfo, [field.id]: checked as boolean })
                    }
                  />
                  <Label htmlFor={field.id} className="cursor-pointer flex-1">
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">특별 요청사항</Label>
              <Textarea
                id="specialRequirements"
                placeholder="추가로 필요한 장비나 요청사항을 입력해주세요"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresentationUpload;
