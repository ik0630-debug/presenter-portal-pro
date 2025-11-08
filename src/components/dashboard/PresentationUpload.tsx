import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X, Calendar } from "lucide-react";
import { toast } from "sonner";

const PresentationUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState<string>("");
  const deadline = "2024-12-31 23:59";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("파일 크기는 100MB를 초과할 수 없습니다.");
        return;
      }
      
      setUploadedFile(file);
      setUploadDate(new Date().toLocaleString("ko-KR"));
      toast.success("파일이 선택되었습니다.");
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast.error("업로드할 파일을 선택해주세요.");
      return;
    }

    // TODO: 실제 파일 업로드 로직 구현
    toast.success("발표자료가 업로드되었습니다.");
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setUploadDate("");
    toast.info("파일이 제거되었습니다.");
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
          <CardDescription>
            PPT, PDF, KEY 파일을 업로드할 수 있습니다 (최대 100MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                파일을 드래그하거나 클릭하여 업로드하세요
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
                accept=".ppt,.pptx,.pdf,.key"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-3">
                  <File className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {uploadDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        업로드: {uploadDate}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpload} className="flex-1">
                  업로드
                </Button>
                <label htmlFor="file-reupload" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>다른 파일 선택</span>
                  </Button>
                </label>
                <input
                  id="file-reupload"
                  type="file"
                  className="hidden"
                  accept=".ppt,.pptx,.pdf,.key"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 마감 시간까지 자유롭게 수정 가능합니다</p>
            <p>• 지원 형식: PPT, PPTX, PDF, KEY</p>
            <p>• 최대 파일 크기: 100MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresentationUpload;
