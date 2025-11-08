import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckSquare, Info, LogOut, DollarSign, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PresentationUpload from "@/components/dashboard/PresentationUpload";
import PresentationInfo from "@/components/dashboard/PresentationInfo";
import ConsentChecklist from "@/components/dashboard/ConsentChecklist";
import OrganizerInfo from "@/components/dashboard/OrganizerInfo";
import HonorariumInfo from "@/components/dashboard/HonorariumInfo";
import ArrivalGuide from "@/components/dashboard/ArrivalGuide";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("project");
  const [speakerName, setSpeakerName] = useState("발표자");

  useEffect(() => {
    const sessionStr = localStorage.getItem('speakerSession');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setSpeakerName(session.name || "발표자");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('speakerSession');
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              발표자 대시보드
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{speakerName} 님 환영합니다</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">발표 정보 관리</CardTitle>
            <CardDescription>
              발표자료 업로드 및 관련 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 gap-2">
                <TabsTrigger value="project" className="gap-2">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">프로젝트</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">자료 업로드</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">발표 정보</span>
                </TabsTrigger>
                <TabsTrigger value="consent" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">동의서</span>
                </TabsTrigger>
                <TabsTrigger value="honorarium" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">강연료</span>
                </TabsTrigger>
                <TabsTrigger value="arrival" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">도착 안내</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="project" className="space-y-4">
                <OrganizerInfo />
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <PresentationUpload />
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <PresentationInfo />
              </TabsContent>

              <TabsContent value="consent" className="space-y-4">
                <ConsentChecklist />
              </TabsContent>

              <TabsContent value="honorarium" className="space-y-4">
                <HonorariumInfo />
              </TabsContent>

              <TabsContent value="arrival" className="space-y-4">
                <ArrivalGuide />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
