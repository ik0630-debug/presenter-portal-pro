import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { upsertResponse, uploadFile } from "@/services/externalApi";

interface ConsentItem {
  id: string;
  field_key: string;
  title: string;
  content: string;
  required: boolean;
}

interface ConsentChecklistProps {
  projectId?: string;
  speakerEmail?: string;
  onStepComplete?: () => void;
}

const ConsentChecklist = ({ projectId: urlProjectId, speakerEmail: urlSpeakerEmail, onStepComplete }: ConsentChecklistProps = {}) => {
  const [consents, setConsents] = useState<Record<string, boolean | null>>({});
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>(urlProjectId || "");
  const signaturePadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('ConsentChecklist - Current user:', user?.email);
      
      if (!user?.email) {
        console.log('ConsentChecklist - No authenticated user, showing default items');
        // 인증된 사용자가 없어도 기본 동의서는 표시
      }

      // 기본 동의서 항목 (항상 표시)
      const defaultItems: ConsentItem[] = [
        {
          id: "default_privacy",
          field_key: "privacy",
          title: "개인정보 수집·이용 동의",
          required: true,
          content: `정보 수집자: (주)엠앤씨커뮤니케이션즈

수집하는 정보: 본 시스템을 통해 취득하는 모든 정보 (성명, 소속, 연락처, 발표자료, 서명 등)

수집 및 이용 기간: 수집일로부터 3년

※ 본 동의를 거부하실 수 있으나, 동의하지 않을 경우 행사 참가가 불가합니다.`,
        },
        {
          id: "default_copyright",
          field_key: "copyright",
          title: "저작권 사용 동의",
          required: true,
          content: `본인은 금번 발표자료에 대한 저작권을 주최측에 제공하며, 주최측이 다음의 목적으로 사용하는 것에 동의합니다:

1. 행사 기록 및 홍보물 제작
2. 온라인 배포 및 아카이빙
3. SNS 및 미디어를 통한 공유
4. 향후 관련 행사에서의 참고자료 활용

단, 상업적 목적으로 사용하고자 하는 경우 사전 협의를 통해 진행합니다.`,
        },
        {
          id: "default_portraitRights",
          field_key: "portraitRights",
          title: "초상권 사용 동의",
          required: true,
          content: `본인은 행사 진행 중 촬영된 사진 및 영상에 대한 초상권을 다음과 같이 제공합니다:

1. 행사 홍보물 및 리포트 제작
2. 공식 웹사이트 및 SNS 게시
3. 언론사 배포 및 보도자료 활용
4. 향후 관련 행사 홍보 활용

본인의 사진 및 영상은 행사의 품격을 유지하는 범위 내에서 사용되며, 부적절한 용도로 사용되지 않을 것을 확인합니다.`,
        },
        {
          id: "default_recording",
          field_key: "recording",
          title: "발표 녹음/녹화 동의",
          required: true,
          content: `본인은 발표 내용의 녹음 및 녹화에 동의하며, 해당 자료의 활용에 대해 다음과 같이 허락합니다:

1. 행사 참가자에게 다시보기 서비스 제공
2. 온라인 플랫폼을 통한 스트리밍 및 VOD 서비스
3. 교육 및 연구 목적의 활용
4. 행사 하이라이트 영상 제작

녹음/녹화된 자료는 주최측이 관리하며, 개인정보 보호법에 따라 안전하게 보관됩니다.`,
        },
        {
          id: "default_materials",
          field_key: "materials",
          title: "자료 배포 동의",
          required: false,
          content: `본인은 제출한 발표자료가 행사 참가자들에게 배포되는 것에 동의합니다:

1. 행사 참가자에게 PDF 파일이나 인쇄물 형태로 배포
2. 행사 웹사이트를 통한 다운로드 제공
3. 이메일을 통한 자료 발송
4. 온라인 커뮤니티에서의 공유

배포되는 자료에는 저작권 표시가 포함되며, 상업적 용도의 무단 사용을 금지합니다.`,
        },
      ];

      // speaker_sessions 조회 (있으면 추가 정보 로드)
      let session = null;
      
      if (user?.email) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('speaker_sessions')
          .select('id, project_id')
          .eq('email', user.email)
          .maybeSingle();

        console.log('ConsentChecklist - Session query result:', { sessionData, sessionError });
        session = sessionData;
      }

      let customItems: ConsentItem[] = [];
      
      if (session) {
        setSessionId(session.id);
        setProjectId(session.project_id);

        // 동적 동의 필드 로드 (추가 항목)
        if (session.project_id) {
          console.log('ConsentChecklist - Loading custom fields for project:', session.project_id);
          const { data: fields, error: fieldsError } = await supabase
            .from('consent_fields')
            .select('*')
            .eq('project_id', session.project_id)
            .order('display_order', { ascending: true });

          console.log('ConsentChecklist - Custom fields result:', { fields, fieldsError });

          if (fields && fields.length > 0) {
            customItems = fields.map(f => ({
              id: f.id,
              field_key: f.field_key,
              title: f.title,
              content: f.content,
              required: f.is_required,
            }));
          }
        }

        // 기존 동의 정보 로드
        const { data: existingConsent } = await supabase
          .from('consent_records')
          .select('*')
          .eq('session_id', session.id)
          .maybeSingle();

        console.log('ConsentChecklist - Existing consent:', existingConsent);

        if (existingConsent && existingConsent.custom_consents) {
          setConsents(existingConsent.custom_consents as Record<string, boolean | null>);
          setIsLoading(false);
          const allItems = [...defaultItems, ...customItems];
          setConsentItems(allItems);
          return;
        }
      } else {
        console.log('ConsentChecklist - No session found, showing default items only');
      }

      // 기본 항목 + 커스텀 항목
      const allItems = [...defaultItems, ...customItems];
      console.log('ConsentChecklist - Total items:', allItems.length, '(default:', defaultItems.length, ', custom:', customItems.length, ')');
      setConsentItems(allItems);

      // 초기 동의 상태 설정
      const initialConsents: Record<string, boolean | null> = {};
      allItems.forEach(item => {
        initialConsents[item.field_key] = null;
      });
      setConsents(initialConsents);
    } catch (error) {
      console.error('ConsentChecklist - Load error:', error);
      toast.error('동의서 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  const allRequiredConsented = consentItems
    .filter(item => item.required)
    .every(item => consents[item.field_key] === true);

  const handleConsentChange = (fieldKey: string, value: boolean) => {
    setConsents(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleComplete = () => {
    if (!allRequiredConsented) {
      toast.error("필수 동의 항목을 모두 동의해주세요.");
      return;
    }
    
    if (!sessionId) {
      toast.warning("세션 정보가 없어 서명 저장이 제한됩니다. 계속하시겠습니까?");
    }
    
    setIsSignatureOpen(true);
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signaturePadRef.current?.isEmpty()) {
      toast.error("서명을 작성해주세요.");
      return;
    }

    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없어 저장할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 서명 이미지를 Blob으로 변환
      const signatureDataUrl = signaturePadRef.current?.toDataURL();
      if (!signatureDataUrl) {
        throw new Error("서명 데이터를 가져올 수 없습니다.");
      }

      // DataURL을 Blob으로 변환
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Storage에 업로드
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const fileName = `${user.id}/${sessionId}_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('consent-signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      // 동의 정보 저장
      const { data: existing } = await supabase
        .from('consent_records')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      const consentData = {
        session_id: sessionId,
        custom_consents: consents,
        signature_image_path: fileName,
        consent_date: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('consent_records')
          .update(consentData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('consent_records')
          .insert(consentData);

        if (error) throw error;
      }

      toast.success("동의가 완료되었습니다.");
      setIsSignatureOpen(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("동의 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (consentItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">동의서 항목이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              {consentItems.map((item) => (
                <AccordionItem key={item.field_key} value={item.field_key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium">{item.title}</span>
                      <span className={`text-sm ${item.required ? 'text-destructive' : 'text-muted-foreground'}`}>
                        ({item.required ? '필수' : '선택'})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="pl-4 pr-4 py-3 bg-muted/50 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                          {item.content}
                        </pre>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleConsentChange(item.field_key, true)}
                          className={consents[item.field_key] === true ? 'bg-primary' : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'}
                        >
                          {consents[item.field_key] === true && <CheckCircle2 className="h-4 w-4 mr-1" />}
                          동의합니다
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConsentChange(item.field_key, false)}
                          className={consents[item.field_key] === false ? 'border-destructive text-destructive' : ''}
                        >
                          동의하지 않습니다
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {!allRequiredConsented && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>발표 진행을 위해 필수 동의 항목에 모두 동의가 필요합니다.</p>
              </div>
            )}

            <Button 
              type="button" 
              className="w-full" 
              disabled={!allRequiredConsented}
              onClick={handleComplete}
            >
              동의 완료
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              서명
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSignatureOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              아래 박스에 서명해주세요
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed rounded-lg overflow-hidden">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  className: "w-full h-48 bg-white",
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearSignature}
                className="flex-1"
                disabled={isSubmitting}
              >
                지우기
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "확인"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsentChecklist;
