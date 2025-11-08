import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PresentationInfo = () => {
  const [formData, setFormData] = useState({
    needsAudio: false,
    ownLaptop: false,
    hasVideo: false,
    specialRequirements: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 서버에 정보 저장
    toast.success("발표 정보가 저장되었습니다.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">발표 관련 정보</CardTitle>
        <CardDescription>
          발표 시 필요한 장비 및 요청사항을 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <Checkbox
                id="needsAudio"
                checked={formData.needsAudio}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, needsAudio: checked as boolean })
                }
              />
              <Label htmlFor="needsAudio" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">소리 사용</p>
                  <p className="text-sm text-muted-foreground">
                    발표 중 오디오를 재생합니다
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <Checkbox
                id="ownLaptop"
                checked={formData.ownLaptop}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ownLaptop: checked as boolean })
                }
              />
              <Label htmlFor="ownLaptop" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">개인 노트북 사용</p>
                  <p className="text-sm text-muted-foreground">
                    본인의 노트북으로 발표합니다
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <Checkbox
                id="hasVideo"
                checked={formData.hasVideo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasVideo: checked as boolean })
                }
              />
              <Label htmlFor="hasVideo" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">동영상 상영</p>
                  <p className="text-sm text-muted-foreground">
                    발표에 동영상이 포함되어 있습니다
                  </p>
                </div>
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequirements">특별 요청사항</Label>
            <Textarea
              id="specialRequirements"
              placeholder="추가로 필요한 장비나 요청사항을 입력해주세요"
              value={formData.specialRequirements}
              onChange={(e) =>
                setFormData({ ...formData, specialRequirements: e.target.value })
              }
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              예: 레이저 포인터, 화이트보드, 추가 마이크 등
            </p>
          </div>

          <Button type="submit" className="w-full">
            저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PresentationInfo;
