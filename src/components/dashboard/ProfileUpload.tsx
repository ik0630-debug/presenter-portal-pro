import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, User } from "lucide-react";
import { toast } from "sonner";

const ProfileUpload = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [career, setCareer] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("이미지 파일만 업로드 가능합니다.");
        return;
      }

      setProfileImage(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success("프로필 사진이 선택되었습니다.");
    }
  };

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      setCvFile(file);
      toast.success("CV 파일이 선택되었습니다.");
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    toast.info("프로필 사진이 제거되었습니다.");
  };

  const handleRemoveCv = () => {
    setCvFile(null);
    toast.info("CV 파일이 제거되었습니다.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bio || !career) {
      toast.error("모든 필수 정보를 입력해주세요.");
      return;
    }

    // TODO: DB 저장 및 파일 업로드
    toast.success("프로필 정보가 저장되었습니다.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로필 사진</CardTitle>
          <CardDescription>
            발표자 소개에 사용될 사진을 업로드해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {profileImagePreview ? (
              <div className="relative">
                <img
                  src={profileImagePreview}
                  alt="프로필 미리보기"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="profile-image" className="cursor-pointer">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                  <User className="h-12 w-12 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-2">사진 선택</p>
                </div>
                <input
                  id="profile-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG (5MB 이내)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">이력 정보</CardTitle>
          <CardDescription>
            발표자 소개에 사용될 이력을 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">약력 / 소개 *</Label>
              <Textarea
                id="bio"
                placeholder="예) 서울대학교 컴퓨터공학과 교수&#10;AI 및 머신러닝 전문가"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="career">주요 경력 *</Label>
              <Textarea
                id="career"
                placeholder="예) - 2020-현재: 서울대학교 컴퓨터공학과 교수&#10;- 2015-2020: Google AI Research Scientist"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                required
                rows={4}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CV 업로드</CardTitle>
          <CardDescription>
            상세 이력서(CV)를 업로드해주세요 (선택사항)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            {cvFile ? (
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{cvFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCv}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="cv-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  클릭하여 CV 파일 선택
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX (10MB 이내)
                </p>
                <input
                  id="cv-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvSelect}
                />
              </label>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            onClick={handleSubmit}
          >
            저장하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileUpload;
