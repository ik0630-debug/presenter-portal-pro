import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, X, Calendar, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  file: File;
  uploadDate: string;
  isSelected: boolean;
  id?: string; // DB에서 로드된 파일의 경우
  filePath?: string; // Storage 경로
}

const PresentationUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const deadline = "2024-12-31 23:59";
  
  // 발표 관련 정보 상태
  const [presentationInfo, setPresentationInfo] = useState({
    needsAudio: false,
    ownLaptop: false,
    hasVideo: false,
    specialRequirements: "",
  });

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
        .select('id')
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

      // 발표 정보 로드
      const { data: info, error: infoError } = await supabase
        .from('presentation_info')
        .select('*')
        .eq('session_id', session.id)
        .maybeSingle();

      if (infoError) {
        console.error('Info error:', infoError);
      } else if (info) {
        setPresentationInfo({
          needsAudio: info.use_audio,
          ownLaptop: info.use_personal_laptop,
          hasVideo: info.use_video,
          specialRequirements: info.special_requests || "",
        });
      }

      // 업로드된 파일 목록 로드
      const { data: files, error: filesError } = await supabase
        .from('presentation_files')
        .select('*')
        .eq('session_id', session.id)
        .order('uploaded_at', { ascending: false });

      if (filesError) {
        console.error('Files error:', filesError);
      } else if (files && files.length > 0) {
        // TODO: Storage에서 실제 파일을 다운로드하거나 참조를 표시
        toast.info(`${files.length}개의 업로드된 파일이 있습니다.`);
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
        isSelected: uploadedFiles.length === 0, // 첫 파일은 자동으로 선택
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
        if (uploadedFile.id) continue; // 이미 업로드된 파일은 건너뛰기

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
    setUploadedFiles(newFiles);
    toast.info("파일이 제거되었습니다.");
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
        use_audio: presentationInfo.needsAudio,
        use_personal_laptop: presentationInfo.ownLaptop,
        use_video: presentationInfo.hasVideo,
        special_requests: presentationInfo.specialRequirements,
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
                      <p className="font-medium truncate">{uploadedFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
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
            <p>• 여러 파일을 업로드한 경우 체크박스로 송출할 파일을 선택해주세요</p>
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
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="hasVideo"
                  checked={presentationInfo.hasVideo}
                  onCheckedChange={(checked) =>
                    setPresentationInfo({ ...presentationInfo, hasVideo: checked as boolean })
                  }
                />
                <Label htmlFor="hasVideo" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">동영상 상영</p>
                    <p className="text-sm text-muted-foreground">
                      발표에 동영상이 포함되어 있습니다
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="needsAudio"
                  checked={presentationInfo.needsAudio}
                  onCheckedChange={(checked) =>
                    setPresentationInfo({ ...presentationInfo, needsAudio: checked as boolean })
                  }
                />
                <Label htmlFor="needsAudio" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">소리 사용</p>
                    <p className="text-sm text-muted-foreground">
                      발표 중 오디오를 재생합니다
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="ownLaptop"
                  checked={presentationInfo.ownLaptop}
                  onCheckedChange={(checked) =>
                    setPresentationInfo({ ...presentationInfo, ownLaptop: checked as boolean })
                  }
                />
                <Label htmlFor="ownLaptop" className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">개인 노트북 사용</p>
                    <p className="text-sm text-muted-foreground">
                      본인의 노트북으로 발표합니다
                    </p>
                    <p className="text-sm text-destructive font-medium mt-1">
                      맥(MAC) 사용 시 반드시 개인 맥북(노트북) 지참하셔야 합니다.
                    </p>
                  </div>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">특별 요청사항</Label>
              <Textarea
                id="specialRequirements"
                placeholder="추가로 필요한 장비나 요청사항을 입력해주세요&#10;클리커(포인터) 외 키보드 마우스 컨트롤 등 시연이 필요한 경우 반드시 요청사항에 입력 바랍니다."
                value={presentationInfo.specialRequirements}
                onChange={(e) =>
                  setPresentationInfo({ ...presentationInfo, specialRequirements: e.target.value })
                }
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
