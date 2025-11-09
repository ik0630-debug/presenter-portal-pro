import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SpeakerConfirmation from "@/components/dashboard/SpeakerConfirmation";
import ProfileUpload from "@/components/dashboard/ProfileUpload";
import HonorariumInfo from "@/components/dashboard/HonorariumInfo";
import PresentationUpload from "@/components/dashboard/PresentationUpload";
import ConsentChecklist from "@/components/dashboard/ConsentChecklist";
import ArrivalGuide from "@/components/dashboard/ArrivalGuide";
import TransportationInfo from "@/components/dashboard/TransportationInfo";

const STEPS = [
  { id: 'confirm', label: '발표자 확인', component: null },
  { id: 'profile', label: '프로필 등록', component: ProfileUpload },
  { id: 'honorarium', label: '강연료 정보', component: HonorariumInfo },
  { id: 'upload', label: '발표자료', component: PresentationUpload },
  { id: 'consent', label: '동의서', component: ConsentChecklist },
  { id: 'transportation', label: '참석 정보', component: TransportationInfo },
  { id: 'arrival', label: '현장안내', component: ArrivalGuide },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [speakerName, setSpeakerName] = useState("발표자");

  useEffect(() => {
    const sessionStr = localStorage.getItem('speakerSession');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setSpeakerName(session.name || "발표자");
    }
  }, []);

  const handleConfirmation = () => {
    setShowConfirmation(false);
    setCurrentStep(1); // 프로필 등록 단계로 시작
  };

  const handleLogout = () => {
    localStorage.removeItem('speakerSession');
    navigate("/auth");
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const CurrentStepComponent = STEPS[currentStep]?.component;

  if (showConfirmation) {
    return <SpeakerConfirmation onConfirm={handleConfirmation} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              발표자 포털
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{speakerName} 님</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <Card className="mb-6 shadow-elevated">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">진행 상황</h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStep}/{STEPS.length - 1} 단계
                  </p>
                </div>
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between pt-2">
                {STEPS.slice(1).map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                        ${isCompleted ? 'bg-primary text-primary-foreground' : 
                          isActive ? 'bg-primary text-primary-foreground' : 
                          'bg-muted text-muted-foreground'}
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`text-xs text-center hidden sm:block ${isActive ? 'font-semibold' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="shadow-elevated animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">{STEPS[currentStep].label}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "발표자 소개에 사용될 프로필 정보를 등록해주세요"}
              {currentStep === 2 && "강연료 지급을 위한 정보와 서류를 제출해주세요"}
              {currentStep === 3 && "발표 자료를 업로드하고 발표 관련 정보를 입력해주세요"}
              {currentStep === 4 && "발표 진행을 위해 동의서를 작성해주세요"}
              {currentStep === 5 && "행사 참석 정보와 교통편 정보를 입력해주세요"}
              {currentStep === 6 && "현장 도착 안내를 확인해주세요"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {CurrentStepComponent && <CurrentStepComponent />}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep <= 1}
            className="flex-1"
          >
            이전 단계
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep >= STEPS.length - 1}
            className="flex-1"
          >
            {currentStep === STEPS.length - 1 ? "완료" : "다음 단계"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
