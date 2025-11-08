import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
      title: "저작권 사용 동의",
      content: `본인은 금번 발표자료에 대한 저작권을 주최측에 제공하며, 주최측이 다음의 목적으로 사용하는 것에 동의합니다:

1. 행사 기록 및 홍보물 제작
2. 온라인 배포 및 아카이빙
3. SNS 및 미디어를 통한 공유
4. 향후 관련 행사에서의 참고자료 활용

단, 상업적 목적으로 사용하고자 하는 경우 사전 협의를 통해 진행합니다.`,
    },
    {
      id: "portraitRights",
      title: "초상권 사용 동의",
      content: `본인은 행사 진행 중 촬영된 사진 및 영상에 대한 초상권을 다음과 같이 제공합니다:

1. 행사 홍보물 및 리포트 제작
2. 공식 웹사이트 및 SNS 게시
3. 언론사 배포 및 보도자료 활용
4. 향후 관련 행사 홍보 활용

본인의 사진 및 영상은 행사의 품격을 유지하는 범위 내에서 사용되며, 부적절한 용도로 사용되지 않을 것을 확인합니다.`,
    },
    {
      id: "recording",
      title: "발표 녹음/녹화 동의",
      content: `본인은 발표 내용의 녹음 및 녹화에 동의하며, 해당 자료의 활용에 대해 다음과 같이 허락합니다:

1. 행사 참가자에게 다시보기 서비스 제공
2. 온라인 플랫폼을 통한 스트리밍 및 VOD 서비스
3. 교육 및 연구 목적의 활용
4. 행사 하이라이트 영상 제작

녹음/녹화된 자료는 주최측이 관리하며, 개인정보 보호법에 따라 안전하게 보관됩니다.`,
    },
    {
      id: "materials",
      title: "자료 배포 동의",
      content: `본인은 제출한 발표자료가 행사 참가자들에게 배포되는 것에 동의합니다:

1. 행사 참가자에게 PDF 파일 형태로 배포
2. 행사 웹사이트를 통한 다운로드 제공
3. 이메일을 통한 자료 발송
4. 온라인 커뮤니티에서의 공유

배포되는 자료에는 저작권 표시가 포함되며, 상업적 용도의 무단 사용을 금지합니다.`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">발표 관련 동의서</CardTitle>
        <CardDescription>
          각 항목을 펼쳐서 세부 내용을 확인하신 후 동의해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            {consentItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={item.id}
                      checked={consents[item.id as keyof typeof consents]}
                      onCheckedChange={(checked) =>
                        setConsents({
                          ...consents,
                          [item.id]: checked as boolean,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label
                      htmlFor={item.id}
                      className="text-base font-medium cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.title}
                    </Label>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-9 pr-4 py-3 bg-muted/50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                      {item.content}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

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
