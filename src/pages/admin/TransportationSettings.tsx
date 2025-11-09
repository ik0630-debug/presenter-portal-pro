import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, MoveRight, MoveLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TransportationSettings {
  accepted_items: string[];
  rejected_items: string[];
}

const TransportationSettings = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptedItems, setAcceptedItems] = useState<string[]>([
    "국내 항공",
    "기차",
    "고속(시외)버스",
    "택시 영수증(시내 이동에 한하며, 최대 2만원 한도)",
    "톨게이트 영수증"
  ]);
  const [rejectedItems, setRejectedItems] = useState<string[]>([
    "타인 명의로 발행된 항공권",
    "유류비(주유비)"
  ]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('project_settings')
        .select('setting_value')
        .eq('project_id', projectId)
        .eq('setting_key', 'transportation_receipt_rules')
        .single();

      if (data && !error) {
        const settings = data.setting_value as unknown as TransportationSettings;
        setAcceptedItems(settings.accepted_items || []);
        setRejectedItems(settings.rejected_items || []);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      const settingValue = {
        accepted_items: acceptedItems,
        rejected_items: rejectedItems
      };

      const { error } = await supabase
        .from('project_settings')
        .upsert({
          project_id: projectId,
          setting_key: 'transportation_receipt_rules',
          setting_value: settingValue
        }, {
          onConflict: 'project_id,setting_key'
        });

      if (error) throw error;

      toast.success("교통비 영수증 설정이 저장되었습니다.");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = (type: 'accepted' | 'rejected') => {
    if (!newItem.trim()) {
      toast.error("항목을 입력해주세요.");
      return;
    }

    if (type === 'accepted') {
      if (acceptedItems.includes(newItem.trim())) {
        toast.error("이미 존재하는 항목입니다.");
        return;
      }
      setAcceptedItems([...acceptedItems, newItem.trim()]);
    } else {
      if (rejectedItems.includes(newItem.trim())) {
        toast.error("이미 존재하는 항목입니다.");
        return;
      }
      setRejectedItems([...rejectedItems, newItem.trim()]);
    }
    
    setNewItem("");
    toast.success("항목이 추가되었습니다.");
  };

  const handleRemoveItem = (type: 'accepted' | 'rejected', index: number) => {
    if (type === 'accepted') {
      setAcceptedItems(acceptedItems.filter((_, i) => i !== index));
    } else {
      setRejectedItems(rejectedItems.filter((_, i) => i !== index));
    }
    toast.success("항목이 삭제되었습니다.");
  };

  const handleMoveItem = (type: 'accepted' | 'rejected', index: number) => {
    if (type === 'accepted') {
      const item = acceptedItems[index];
      setAcceptedItems(acceptedItems.filter((_, i) => i !== index));
      setRejectedItems([...rejectedItems, item]);
      toast.success("불인정 항목으로 이동했습니다.");
    } else {
      const item = rejectedItems[index];
      setRejectedItems(rejectedItems.filter((_, i) => i !== index));
      setAcceptedItems([...acceptedItems, item]);
      toast.success("인정 항목으로 이동했습니다.");
    }
  };

  const handleEditItem = (type: 'accepted' | 'rejected', index: number, newValue: string) => {
    if (type === 'accepted') {
      const updated = [...acceptedItems];
      updated[index] = newValue;
      setAcceptedItems(updated);
    } else {
      const updated = [...rejectedItems];
      updated[index] = newValue;
      setRejectedItems(updated);
    }
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/projects`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                교통비 영수증 항목 설정
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                인정/불인정 항목을 관리합니다
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* 새 항목 추가 */}
          <Card>
            <CardHeader>
              <CardTitle>새 항목 추가</CardTitle>
              <CardDescription>
                인정 또는 불인정 항목을 추가합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="예: 지하철 교통카드 영수증"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem('accepted');
                    }
                  }}
                />
                <Button onClick={() => handleAddItem('accepted')}>
                  <Plus className="h-4 w-4 mr-2" />
                  인정 항목에 추가
                </Button>
                <Button onClick={() => handleAddItem('rejected')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  불인정 항목에 추가
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 인정 항목 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">
                  인정 항목 ({acceptedItems.length})
                </CardTitle>
                <CardDescription>
                  교통비로 인정되는 영수증 항목입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {acceptedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      인정 항목이 없습니다
                    </p>
                  ) : (
                    acceptedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900"
                      >
                        <Input
                          value={item}
                          onChange={(e) => handleEditItem('accepted', index, e.target.value)}
                          className="flex-1 bg-background"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('accepted', index)}
                          title="불인정 항목으로 이동"
                        >
                          <MoveRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem('accepted', index)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 불인정 항목 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  불인정 항목 ({rejectedItems.length})
                </CardTitle>
                <CardDescription>
                  교통비로 인정되지 않는 항목입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rejectedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      불인정 항목이 없습니다
                    </p>
                  ) : (
                    rejectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('rejected', index)}
                          title="인정 항목으로 이동"
                        >
                          <MoveLeft className="h-4 w-4" />
                        </Button>
                        <Input
                          value={item}
                          onChange={(e) => handleEditItem('rejected', index, e.target.value)}
                          className="flex-1 bg-background"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem('rejected', index)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "저장 중..." : "설정 저장"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransportationSettings;
