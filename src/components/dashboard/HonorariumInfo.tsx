import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Trash2, Pen } from "lucide-react";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";

const HonorariumInfo = () => {
  const [recipientType, setRecipientType] = useState<string>("본인");
  const [incomeType, setIncomeType] = useState<string>("기타소득");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = useState<File | null>(null);
  const [agentConsent, setAgentConsent] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<"upload" | "draw">("draw");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  
  // 수동 입력 관련 state
  const [manualInput, setManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    name: "",
    idNumber: "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountHolder: ""
  });

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "id" | "bankbook"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // 10MB 제한
      if (file.size > 10 * 1024 * 1024) {
        toast.error("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      if (type === "id") {
        setIdFile(file);
        toast.success("신분증 파일이 선택되었습니다.");
      } else {
        setBankbookFile(file);
        toast.success("통장사본 파일이 선택되었습니다.");
      }
    }
  };

  const handleRemoveFile = (type: "id" | "bankbook") => {
    if (type === "id") {
      setIdFile(null);
      toast.info("신분증 파일이 제거되었습니다.");
    } else {
      setBankbookFile(null);
      toast.info("통장사본 파일이 제거되었습니다.");
    }
  };

  const handleSignatureFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("파일 크기는 5MB를 초과할 수 없습니다.");
        return;
      }
      setSignatureFile(file);
      toast.success("서명 파일이 선택되었습니다.");
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    toast.info("서명이 지워졌습니다.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 수동 입력 또는 파일 업로드 검증
    if (!manualInput) {
      if (!idFile || !bankbookFile) {
        toast.error("신분증과 통장사본을 모두 업로드해주세요.");
        return;
      }
    } else {
      // 본인 또는 대리인의 경우 수동 입력 필드 검증
      if (recipientType === "본인" || recipientType === "대리인") {
        const { name, idNumber, address, bankName, accountNumber, accountHolder } = manualData;
        if (!name || !idNumber || !address || !bankName || !accountNumber || !accountHolder) {
          toast.error("모든 필수 정보를 입력해주세요.");
          return;
        }
      }
    }

    if (recipientType === "대리인") {
      if (!agentConsent) {
        toast.error("대리인 위임 동의가 필요합니다.");
        return;
      }
      
      const hasSignature = signatureMethod === "upload" 
        ? signatureFile 
        : !signatureRef.current?.isEmpty();
        
      if (!hasSignature) {
        toast.error("서명을 완료해주세요.");
        return;
      }
    }

    // TODO: DB 저장 및 파일 업로드
    toast.success("강연료 정보가 저장되었습니다.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">강연료 지급 정보</CardTitle>
          <CardDescription>
            강연료 지급을 위한 계좌 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 지급 받는자 선택 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">지급 받는자 *</Label>
              <RadioGroup value={recipientType} onValueChange={setRecipientType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="본인" id="recipient-self" />
                  <Label htmlFor="recipient-self" className="font-normal cursor-pointer">본인</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="소속기업" id="recipient-company" />
                  <Label htmlFor="recipient-company" className="font-normal cursor-pointer">
                    소속 기업(세금계산서 발행)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="대리인" id="recipient-agent" />
                  <Label htmlFor="recipient-agent" className="font-normal cursor-pointer">대리인</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 대리인 동의 및 서명 - 대리인일 경우만 표시 */}
            {recipientType === "대리인" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <p className="text-sm leading-relaxed">
                    본인은 본 행사 참석에 따른 강연료 일체를 대리인이 수령하도록 위임하며, 
                    강연료 지급을 위한 대리인의 개인정보를 아래와 같이 제공합니다. 
                    또한 대리인의 개인정보로 세무신고 등이 진행되는 것에 동의하며, 
                    대리인으로부터 사전 동의를 받았음을 확인합니다.
                  </p>
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="agent-consent"
                      checked={agentConsent}
                      onCheckedChange={(checked) => setAgentConsent(checked as boolean)}
                    />
                    <Label 
                      htmlFor="agent-consent" 
                      className="font-medium cursor-pointer leading-tight"
                    >
                      위 내용을 확인하였으며 동의합니다. *
                    </Label>
                  </div>
                </div>

                {/* 서명 입력 - 동의 체크 시 표시 */}
                {agentConsent && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">서명 *</Label>
                    
                    {/* 서명 방법 선택 */}
                    <RadioGroup value={signatureMethod} onValueChange={(value) => setSignatureMethod(value as "upload" | "draw")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="draw" id="signature-draw" />
                        <Label htmlFor="signature-draw" className="font-normal cursor-pointer">
                          직접 서명(아래 서명 영역에 마우스를 클릭한 채로 서명을 입력합니다.)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="signature-upload" />
                        <Label htmlFor="signature-upload" className="font-normal cursor-pointer">서명 파일 업로드</Label>
                      </div>
                    </RadioGroup>

                    {/* 서명패드 */}
                    {signatureMethod === "draw" && (
                      <div className="space-y-2">
                        <div className="border-2 border-dashed rounded-lg p-2 bg-background">
                          <SignatureCanvas
                            ref={signatureRef}
                            canvasProps={{
                              className: "w-full h-40 border rounded cursor-crosshair bg-white",
                            }}
                            backgroundColor="white"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleClearSignature}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          서명 지우기
                        </Button>
                      </div>
                    )}

                    {/* 서명 파일 업로드 */}
                    {signatureMethod === "upload" && (
                      <div className="space-y-2">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          {signatureFile ? (
                            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">{signatureFile.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSignatureFile(null);
                                  toast.info("서명 파일이 제거되었습니다.");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label htmlFor="signature-file-upload" className="cursor-pointer">
                              <Pen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-1">
                                클릭하여 서명 파일 선택
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG (5MB 이내)
                              </p>
                              <input
                                id="signature-file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleSignatureFileSelect}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 소득 구분 선택 - 본인 또는 대리인일 경우만 표시 */}
            {(recipientType === "본인" || recipientType === "대리인") && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">소득 구분 *</Label>
                <RadioGroup value={incomeType} onValueChange={setIncomeType}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="기타소득" id="income-other" />
                      <Label htmlFor="income-other" className="font-normal cursor-pointer">
                        기타소득(8.8% 공제 후 입금)
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      일시적이고 비정기적 소득인 경우(대부분의 경우에 해당)
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="사업소득" id="income-business" />
                      <Label htmlFor="income-business" className="font-normal cursor-pointer">
                        사업소득(3.3% 공제 후 입금)
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      정기적 소득(프리랜서 등에 해당)
                    </p>
                  </div>
                </RadioGroup>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">첨부 서류</CardTitle>
          <CardDescription>
            신분증과 통장사본 정보를 입력해 주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 수동 입력 옵션 */}
          <div className="flex items-start space-x-2 p-4 bg-muted/30 rounded-lg">
            <Checkbox
              id="manual-input"
              checked={manualInput}
              onCheckedChange={(checked) => setManualInput(checked as boolean)}
            />
            <Label 
              htmlFor="manual-input" 
              className="font-normal cursor-pointer leading-tight"
            >
              파일 업로드 대신 직접 정보를 입력하겠습니다.
            </Label>
          </div>

          {/* 수동 입력 필드 - 본인 또는 대리인이고 체크박스 선택시 */}
          {manualInput && (recipientType === "본인" || recipientType === "대리인") && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">이름 *</Label>
                  <Input
                    id="manual-name"
                    value={manualData.name}
                    onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-id-number">주민등록번호 *</Label>
                  <Input
                    id="manual-id-number"
                    value={manualData.idNumber}
                    onChange={(e) => setManualData({ ...manualData, idNumber: e.target.value })}
                    placeholder="000000-0000000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-address">주소 *</Label>
                <Input
                  id="manual-address"
                  value={manualData.address}
                  onChange={(e) => setManualData({ ...manualData, address: e.target.value })}
                  placeholder="서울시 강남구..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-bank">은행명 *</Label>
                  <Input
                    id="manual-bank"
                    value={manualData.bankName}
                    onChange={(e) => setManualData({ ...manualData, bankName: e.target.value })}
                    placeholder="국민은행"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-account">계좌번호 *</Label>
                  <Input
                    id="manual-account"
                    value={manualData.accountNumber}
                    onChange={(e) => setManualData({ ...manualData, accountNumber: e.target.value })}
                    placeholder="000-00-0000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-holder">예금주 *</Label>
                  <Input
                    id="manual-holder"
                    value={manualData.accountHolder}
                    onChange={(e) => setManualData({ ...manualData, accountHolder: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 파일 업로드 - 수동 입력 미선택시 */}
          {!manualInput && (
            <>
          {/* 신분증 업로드 */}
          <div className="space-y-2">
            <Label>신분증 사본 *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {idFile ? (
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{idFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile("id")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="id-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    클릭하여 신분증 파일 선택
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, PDF (10MB 이내)
                  </p>
                  <input
                    id="id-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect(e, "id")}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 통장사본 업로드 */}
          <div className="space-y-2">
            <Label>통장사본 *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {bankbookFile ? (
                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{bankbookFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile("bankbook")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="bankbook-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    클릭하여 통장사본 파일 선택
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, PDF (10MB 이내)
                  </p>
                  <input
                    id="bankbook-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect(e, "bankbook")}
                  />
                </label>
              )}
            </div>
          </div>
          </>
          )}

          <Button
            type="submit"
            className="w-full"
            onClick={handleSubmit}
          >
            저장하기
          </Button>
        </CardContent>
      </Card>

      <Card className="border-accent/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 발표 종료 후 14일 이내 지급 예정입니다.</p>
            <p>• 제출하신 정보는 강연료 지급 목적으로만 사용됩니다.</p>
            <p>• 세금 계산서 발행이 필요한 경우 별도 연락 부탁드립니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HonorariumInfo;
