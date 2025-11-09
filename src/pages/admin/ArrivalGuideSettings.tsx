import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ArrivalGuideSettings = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [formData, setFormData] = useState({
    venue_name: "",
    venue_address: "",
    venue_map_url: "",
    parking_info: "",
    check_in_time: "",
    check_in_location: "",
    presentation_time: "",
    presentation_room: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    additional_notes: "",
    emergency_contact: "",
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, [projectId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!adminData) {
      navigate("/admin/login");
      toast.error("관리자 권한이 필요합니다.");
    }
  };

  const loadData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      // Load project name
      const { data: project } = await supabase
        .from("projects")
        .select("project_name")
        .eq("id", projectId)
        .single();

      if (project) {
        setProjectName(project.project_name);
      }

      // Load existing settings
      const { data: settings } = await supabase
        .from("arrival_guide_settings")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (settings) {
        setFormData({
          venue_name: settings.venue_name || "",
          venue_address: settings.venue_address || "",
          venue_map_url: settings.venue_map_url || "",
          parking_info: settings.parking_info || "",
          check_in_time: settings.check_in_time || "",
          check_in_location: settings.check_in_location || "",
          presentation_time: settings.presentation_time || "",
          presentation_room: settings.presentation_room || "",
          contact_name: settings.contact_name || "",
          contact_phone: settings.contact_phone || "",
          contact_email: settings.contact_email || "",
          additional_notes: settings.additional_notes || "",
          emergency_contact: settings.emergency_contact || "",
        });
      }
    } catch (error) {
      console.error("Load error:", error);
      toast.error("데이터 로딩 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("arrival_guide_settings")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("arrival_guide_settings")
          .update(formData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("arrival_guide_settings")
          .insert({
            project_id: projectId,
            ...formData,
          });

        if (error) throw error;
      }

      toast.success("현장안내 설정이 저장되었습니다.");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">현장안내 설정</h1>
            <p className="text-muted-foreground mt-1">
              프로젝트: {projectName}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>장소 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue_name">행사장명 *</Label>
                <Input
                  id="venue_name"
                  value={formData.venue_name}
                  onChange={(e) => handleChange("venue_name", e.target.value)}
                  placeholder="예: 서울 코엑스 그랜드볼룸"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_address">주소 *</Label>
                <Input
                  id="venue_address"
                  value={formData.venue_address}
                  onChange={(e) => handleChange("venue_address", e.target.value)}
                  placeholder="예: 서울특별시 강남구 영동대로 513"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_map_url">지도 URL</Label>
                <Input
                  id="venue_map_url"
                  value={formData.venue_map_url}
                  onChange={(e) => handleChange("venue_map_url", e.target.value)}
                  placeholder="예: https://map.naver.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentation_room">발표장</Label>
                <Input
                  id="presentation_room"
                  value={formData.presentation_room}
                  onChange={(e) => handleChange("presentation_room", e.target.value)}
                  placeholder="예: 3층 컨퍼런스홀 A"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>시간 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="check_in_time">체크인 시간</Label>
                <Input
                  id="check_in_time"
                  value={formData.check_in_time}
                  onChange={(e) => handleChange("check_in_time", e.target.value)}
                  placeholder="예: 13:30까지"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_in_location">체크인 장소</Label>
                <Input
                  id="check_in_location"
                  value={formData.check_in_location}
                  onChange={(e) => handleChange("check_in_location", e.target.value)}
                  placeholder="예: 1층 행사 데스크"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentation_time">발표 시간</Label>
                <Input
                  id="presentation_time"
                  value={formData.presentation_time}
                  onChange={(e) => handleChange("presentation_time", e.target.value)}
                  placeholder="예: 14:00 - 14:45"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>주차 안내</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parking_info">주차 정보</Label>
                <Textarea
                  id="parking_info"
                  value={formData.parking_info}
                  onChange={(e) => handleChange("parking_info", e.target.value)}
                  placeholder="주차 위치, 요금, 유의사항 등을 입력하세요"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">담당자명</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                  placeholder="예: 홍보팀 김담당"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">담당자 전화번호</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  placeholder="예: 02-1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">담당자 이메일</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  placeholder="예: contact@conference.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">긴급 연락처</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleChange("emergency_contact", e.target.value)}
                  placeholder="예: 현장 긴급: 010-1234-5678"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>추가 안내사항</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additional_notes">추가 정보</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => handleChange("additional_notes", e.target.value)}
                  placeholder="체크리스트, 준비물, 기타 안내사항 등을 입력하세요"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrivalGuideSettings;
