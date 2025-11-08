import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

const HonorariumInfo = () => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("모든 필수 정보를 입력해주세요.");
      return;
    }

    if (!idFile || !bankbookFile) {
      toast.error("신분증과 통장사본을 모두 업로드해주세요.");
      return;
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">은행명 *</Label>
              <Input
                id="bankName"
                placeholder="예) 국민은행"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">계좌번호 *</Label>
              <Input
                id="accountNumber"
                placeholder="예) 123-456-789012"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolder">예금주 *</Label>
              <Input
                id="accountHolder"
                placeholder="예) 홍길동"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">첨부 서류</CardTitle>
          <CardDescription>
            신분증과 통장사본을 업로드해주세요 (각 10MB 이내)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
