import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

// Temporary type definitions until types.ts is regenerated
interface ArrivalGuideSettings {
  id: string;
  project_id: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string | null;
  presentation_time: string | null;
  presentation_room: string | null;
  check_in_time: string | null;
  check_in_location: string | null;
  parking_info: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  emergency_contact: string | null;
  additional_notes: string | null;
}

interface ArrivalChecklistItem {
  id: string;
  project_id: string;
  item_text: string;
  display_order: number;
  requires_response: boolean;
}

interface ChecklistItem {
  id?: string;
  item_text: string;
  display_order: number;
  requires_response: boolean;
}

const ArrivalGuideSettings = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    venue_name: "",
    venue_address: "",
    venue_map_url: "",
    presentation_time: "",
    presentation_room: "",
    check_in_time: "",
    check_in_location: "",
    parking_info: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    emergency_contact: "",
    additional_notes: "• 발표자료가 당일 변경되는 경우 USB에 담아 지참해 주시고, 세션 시작 전 콘솔 데스크에 전달해 주세요.\n• 현장 도착 후 행사 데스크에서 발표자임을 말씀해주시면 대기실 등을 안내 해 드리겠습니다.\n• 문의사항이 있으시면 언제든 담당자에게 연락 주세요.",
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { item_text: "발표자료 USB 또는 노트북 지참", display_order: 0, requires_response: false },
    { item_text: "신분증 지참 (행사장 출입용)", display_order: 1, requires_response: false },
  ]);

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, [projectId]);

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

  const loadSettings = async () => {
    try {
      // Load arrival guide settings
      const { data: settings, error: settingsError } = await supabase
        .from('arrival_guide_settings' as any)
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settings) {
        const guideSettings = settings as unknown as ArrivalGuideSettings;
        setFormData({
          venue_name: guideSettings.venue_name || "",
          venue_address: guideSettings.venue_address || "",
          venue_map_url: guideSettings.venue_map_url || "",
          presentation_time: guideSettings.presentation_time || "",
          presentation_room: guideSettings.presentation_room || "",
          check_in_time: guideSettings.check_in_time || "",
          check_in_location: guideSettings.check_in_location || "",
          parking_info: guideSettings.parking_info || "",
          contact_name: guideSettings.contact_name || "",
          contact_phone: guideSettings.contact_phone || "",
          contact_email: guideSettings.contact_email || "",
          emergency_contact: guideSettings.emergency_contact || "",
          additional_notes: guideSettings.additional_notes || formData.additional_notes,
        });
      }

      // Load checklist items
      const { data: items, error: itemsError } = await supabase
        .from('arrival_checklist_items' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('display_order');

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        const checklistItems = items as unknown as ArrivalChecklistItem[];
        setChecklistItems(checklistItems);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("설정을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      // Upsert arrival guide settings
      const { error: settingsError } = await supabase
        .from('arrival_guide_settings' as any)
        .upsert({
          project_id: projectId,
          ...formData,
        }, {
          onConflict: 'project_id'
        });

      if (settingsError) throw settingsError;

      // Delete existing checklist items
      const { error: deleteError } = await supabase
        .from('arrival_checklist_items' as any)
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Insert new checklist items
      if (checklistItems.length > 0) {
        const itemsToInsert = checklistItems.map((item, index) => ({
          project_id: projectId,
          item_text: item.item_text,
          display_order: index,
          requires_response: item.requires_response,
        }));

        const { error: itemsError } = await supabase
          .from('arrival_checklist_items' as any)
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast.success("설정이 저장되었습니다.");
    } catch (error: any) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      {
        item_text: "",
        display_order: checklistItems.length,
        requires_response: false,
      }
    ]);
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const newItems = [...checklistItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setChecklistItems(newItems);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              현장안내 설정
            </h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>행사장 정보</CardTitle>
            <CardDescription>행사장 위치 및 시간 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue_name">행사장명</Label>
                <Input
                  id="venue_name"
                  value={formData.venue_name}
                  onChange={(e) => setFormData({...formData, venue_name: e.target.value})}
                  placeholder="예: 서울 코엑스 그랜드볼룸"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presentation_room">발표실</Label>
                <Input
                  id="presentation_room"
                  value={formData.presentation_room}
                  onChange={(e) => setFormData({...formData, presentation_room: e.target.value})}
                  placeholder="예: 3층 A홀"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue_address">주소</Label>
              <Input
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => setFormData({...formData, venue_address: e.target.value})}
                placeholder="예: 서울특별시 강남구 영동대로 513"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue_map_url">지도 URL (선택)</Label>
              <Input
                id="venue_map_url"
                value={formData.venue_map_url}
                onChange={(e) => setFormData({...formData, venue_map_url: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presentation_time">발표 시간</Label>
                <Input
                  id="presentation_time"
                  value={formData.presentation_time}
                  onChange={(e) => setFormData({...formData, presentation_time: e.target.value})}
                  placeholder="예: 14:00 - 14:45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_in_time">체크인 시간</Label>
                <Input
                  id="check_in_time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({...formData, check_in_time: e.target.value})}
                  placeholder="예: 13:30까지"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_in_location">체크인 장소</Label>
              <Input
                id="check_in_location"
                value={formData.check_in_location}
                onChange={(e) => setFormData({...formData, check_in_location: e.target.value})}
                placeholder="예: 1층 로비 안내 데스크"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>주차 안내</CardTitle>
            <CardDescription>주차 관련 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parking_info">주차 정보</Label>
              <Textarea
                id="parking_info"
                value={formData.parking_info}
                onChange={(e) => setFormData({...formData, parking_info: e.target.value})}
                placeholder="주차 위치, 요금, 안내사항 등을 입력하세요"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>연락처 정보</CardTitle>
            <CardDescription>담당자 연락처를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">담당자명</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                placeholder="예: 홍보팀 김담당"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">전화번호</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="예: 02-1234-5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">이메일</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">긴급 연락처</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                placeholder="예: 010-1234-5678"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>현장 체크리스트</CardTitle>
                <CardDescription>연사가 확인해야 할 항목들을 추가하세요</CardDescription>
              </div>
              <Button onClick={addChecklistItem} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                항목 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                <div className="flex-1 space-y-3">
                  <Input
                    value={item.item_text}
                    onChange={(e) => updateChecklistItem(index, 'item_text', e.target.value)}
                    placeholder="체크리스트 항목을 입력하세요"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.requires_response}
                      onCheckedChange={(checked) => updateChecklistItem(index, 'requires_response', checked)}
                    />
                    <Label className="text-sm text-muted-foreground">
                      연사 응답 필요
                    </Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChecklistItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {checklistItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                체크리스트 항목이 없습니다. 항목을 추가해주세요.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>참고 사항</CardTitle>
            <CardDescription>연사에게 전달할 추가 안내사항을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              rows={6}
              placeholder="• 참고사항 1&#10;• 참고사항 2&#10;• 참고사항 3"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ArrivalGuideSettings;
