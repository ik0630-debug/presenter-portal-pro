import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";

interface ConsentItem {
  id: string;
  field_key: string;
  title: string;
  content: string;
  required: boolean;
}

const ConsentChecklist = () => {
  const [consents, setConsents] = useState<Record<string, boolean | null>>({});
  const [consentItems, setConsentItems] = useState<ConsentItem[]>([]);
  
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const signaturePadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("로그인 정보를 찾을 수 없습니다.");
        return;
      }

      const { data: session } = await supabase
        .from('speaker_sessions')
        .select('id, project_id')
        .eq('email', user.email)
        .maybeSingle();

      if (session) {
        setSessionId(session.id);
        setProjectId(session.project_id);

        // 동적 동의 필드 로드
        if (session.project_id) {
          const { data: fields } = await supabase
            .from('consent_fields')
            .select('*')
            .eq('project_id', session.project_id)
            .order('display_order', { ascending: true });

          if (fields && fields.length > 0) {
            setConsentItems(fields.map(f => ({
              id: f.id,
              field_key: f.field_key,
              title: f.title,
              content: f.content,
              required: f.is_required,
            })));

            // 초기 동의 상태 설정
            const initialConsents: Record<string, boolean | null> = {};
            fields.forEach(f => {
              initialConsents[f.field_key] = null;
            });
            setConsents(initialConsents);
          }
        }
        
        // 기존 동의 정보 로드
        const { data: existingConsent } = await supabase
          .from('consent_records')
          .select('*')
          .eq('session_id', session.id)
          .maybeSingle();

        if (existingConsent && existingConsent.custom_consents) {
          setConsents(existingConsent.custom_consents as Record<string, boolean | null>);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
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
      toast.error("세션 정보를 찾을 수 없습니다.");
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
