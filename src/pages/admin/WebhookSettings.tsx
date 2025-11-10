import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check, Webhook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const WebhookSettings = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    checkAuth();
    // Webhook URL 생성
    const url = `https://sohpysufjqydafpenile.supabase.co/functions/v1/webhook-project-sync`;
    setWebhookUrl(url);
  }, []);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Webhook URL이 클립보드에 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Webhook 설정
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                <CardTitle>실시간 프로젝트 동기화</CardTitle>
              </div>
              <CardDescription>
                외부 시스템에서 프로젝트가 변경될 때 자동으로 동기화하려면 아래 Webhook URL을 외부 시스템에 등록하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">외부 시스템 설정 방법</h3>
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li>
                    <strong>Supabase Database Webhooks 설정:</strong>
                    <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                      <li>외부 Supabase 프로젝트의 Database &gt; Webhooks 메뉴로 이동</li>
                      <li>"Create a new hook" 클릭</li>
                      <li>Table: <code className="bg-background px-1 py-0.5 rounded">projects</code></li>
                      <li>Events: <code className="bg-background px-1 py-0.5 rounded">INSERT</code>, <code className="bg-background px-1 py-0.5 rounded">UPDATE</code>, <code className="bg-background px-1 py-0.5 rounded">DELETE</code> 선택</li>
                      <li>Type: <code className="bg-background px-1 py-0.5 rounded">HTTP Request</code></li>
                      <li>HTTP Request 설정:
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>Method: <code className="bg-background px-1 py-0.5 rounded">POST</code></li>
                          <li>URL: 위의 Webhook URL 입력</li>
                          <li>HTTP Headers: <code className="bg-background px-1 py-0.5 rounded">Content-Type: application/json</code></li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li className="mt-3">
                    <strong>테스트:</strong>
                    <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                      <li>외부 시스템에서 프로젝트를 추가, 수정, 삭제</li>
                      <li>이 시스템의 프로젝트 목록에 자동으로 반영되는지 확인</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  💡 Webhook 페이로드 형식
                </h3>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "type": "INSERT",
  "table": "projects",
  "record": {
    "id": "project-id",
    "title": "프로젝트명",
    "description": "설명",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "schema": "public",
  "old_record": null
}`}
                </pre>
              </div>

              <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  ⚠️ 주의사항
                </h3>
                <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100 list-disc list-inside">
                  <li>Webhook은 외부 시스템에서 이 시스템으로 데이터를 자동으로 가져옵니다.</li>
                  <li>외부 프로젝트가 삭제되어도 이 시스템의 프로젝트는 자동으로 삭제되지 않습니다.</li>
                  <li>Webhook 설정 후 외부 시스템에서 변경사항이 실시간으로 반영됩니다.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WebhookSettings;
