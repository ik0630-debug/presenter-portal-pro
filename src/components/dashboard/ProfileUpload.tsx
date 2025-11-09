import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

const ProfileUpload = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 동적 필드 정의
  const profileFields: ProfileField[] = [
    { key: "speaker_name", label: "이름", placeholder: "홍길동", required: true },
    { key: "organization", label: "소속", placeholder: "서울대학교", required: true },
    { key: "department", label: "부서", placeholder: "컴퓨터공학과", required: false },
    { key: "position", label: "직함", placeholder: "교수", required: true },
  ];

  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [careers, setCareers] = useState<string[]>([]);

  useEffect(() => {
    loadSpeakerData();
  }, []);

  const loadSpeakerData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("로그인 정보를 찾을 수 없습니다.");
        return;
      }

      const { data: session, error } = await supabase
        .from("speaker_sessions")
        .select("speaker_name, organization, department, position")
        .eq("email", user.email)
        .single();

      if (error) throw error;

      if (session) {
        setProfileData({
          speaker_name: session.speaker_name || "",
          organization: session.organization || "",
          department: session.department || "",
          position: session.position || "",
        });
      }
    } catch (error) {
      console.error("Error loading speaker data:", error);
      toast.error("발표자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

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
    
    // 필수 필드 검증
    const missingFields = profileFields
      .filter(field => field.required && !profileData[field.key]?.trim())
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`필수 항목을 입력해주세요: ${missingFields.join(", ")}`);
      return;
    }


    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("로그인 정보를 찾을 수 없습니다.");
        return;
      }

      // speaker_sessions 테이블 업데이트
      const { error } = await supabase
        .from("speaker_sessions")
        .update({
          speaker_name: profileData.speaker_name,
          organization: profileData.organization,
          department: profileData.department,
          position: profileData.position,
        })
        .eq("email", user.email);

      if (error) throw error;

      // TODO: CV 파일 업로드 및 경력 정보 저장
      toast.success("프로필 정보가 저장되었습니다.");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("프로필 정보 저장에 실패했습니다.");
    }
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
          <CardTitle className="text-lg">공식 직함</CardTitle>
          <CardDescription>
            연사 소개 페이지, 프로그램북, 명찰 등에 적용할 공식 직함을 입력하여 주십시오.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {profileFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && "*"}
                </Label>
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={profileData[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  required={field.required}
                  disabled={isLoading}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="career">주요 경력 (선택)</Label>
              <p className="text-sm text-muted-foreground">
                연사 소개시 추가적으로 활용될 대표 경력이나 겸직 중인 직책 있다면 작성해주세요.(중요 순서대로 작성)
              </p>
              <div className="space-y-2">
                {careers.map((career, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={career}
                      onChange={(e) => {
                        const newCareers = [...careers];
                        newCareers[index] = e.target.value;
                        setCareers(newCareers);
                      }}
                      placeholder="예) 서울대학교 컴퓨터공학과 교수"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newCareers = careers.filter((_, i) => i !== index);
                        setCareers(newCareers);
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCareers([...careers, ""])}
                  disabled={isLoading}
                  className="w-full"
                >
                  + 경력 추가
                </Button>
              </div>
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
