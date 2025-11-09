import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, File, X, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  uploadDate: string;
  isSelected: boolean;
}

const PresentationUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const deadline = "2024-12-31 23:59";
  
  // 발표 관련 정보 상태
  const [presentationInfo, setPresentationInfo] = useState({
    needsAudio: false,
    ownLaptop: false,
    hasVideo: false,
    specialRequirements: "",
  });

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

    const selectedFile = uploadedFiles.find(f => f.isSelected);
    if (!selectedFile) {
      toast.error("송출할 파일을 선택해주세요.");
      return;
    }

    // TODO: 실제 파일 업로드 로직 구현
    toast.success("발표자료가 업로드되었습니다.");
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

  const handlePresentationInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 서버에 정보 저장
    toast.success("발표 정보가 저장되었습니다.");
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
                <Button onClick={handleUpload} className="flex-1">
                  업로드
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
            발표 시 필요한 장비 및 요청사항을 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePresentationInfoSubmit} className="space-y-6">
            <div className="space-y-4">
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
                  </div>
                </Label>
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">특별 요청사항</Label>
              <Textarea
                id="specialRequirements"
                placeholder="추가로 필요한 장비나 요청사항을 입력해주세요"
                value={presentationInfo.specialRequirements}
                onChange={(e) =>
                  setPresentationInfo({ ...presentationInfo, specialRequirements: e.target.value })
                }
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                예: 레이저 포인터, 화이트보드, 추가 마이크 등
              </p>
            </div>

            <Button type="submit" className="w-full">
              저장
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresentationUpload;
