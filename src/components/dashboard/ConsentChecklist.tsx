import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const ConsentChecklist = () => {
  const [consents, setConsents] = useState({
    copyright: false,
    portraitRights: false,
    recording: false,
    materials: false,
  });

  const allConsented = Object.values(consents).every((value) => value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allConsented) {
      toast.error("모든 항목에 동의해주세요.");
      return;
    }
    // TODO: 서버에 동의 정보 저장
    toast.success("동의가 완료되었습니다.");
  };

  const consentItems = [
    {
      id: "copyright",
      title: "저작권 동의",
      description:
        "발표 자료의 저작권이 본인에게 있으며, 제3자의 권리를 침해하지 않음을 확인합니다.",
    },
    {
      id: "portraitRights",
      title: "초상권 동의",
      description:
        "발표 중 촬영된 사진 및 영상이 행사 홍보 목적으로 사용될 수 있음에 동의합니다.",
    },
    {
      id: "recording",
      title: "녹화 동의",
      description:
        "발표 내용이 녹화되어 온라인으로 공개될 수 있음에 동의합니다.",
    },
    {
      id: "materials",
      title: "자료 배포 동의",
      description:
        "발표 자료가 참가자들에게 공유될 수 있음에 동의합니다.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">동의서</CardTitle>
        <CardDescription>
          발표 진행을 위해 아래 항목에 동의해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {consentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <Checkbox
                  id={item.id}
                  checked={consents[item.id as keyof typeof consents]}
                  onCheckedChange={(checked) =>
                    setConsents({
                      ...consents,
                      [item.id]: checked as boolean,
                    })
                  }
                  className="mt-1"
                />
                <Label htmlFor={item.id} className="cursor-pointer flex-1">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {!allConsented && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>발표 진행을 위해 모든 항목에 동의가 필요합니다.</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!allConsented}>
            동의 완료
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            동의 후에도 주최측에 문의하여 철회할 수 있습니다.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConsentChecklist;
