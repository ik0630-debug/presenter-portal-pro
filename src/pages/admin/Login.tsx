import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try to verify admin from external DB
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-admin', {
        body: { email, password },
      });

      if (verifyError) {
        throw new Error(verifyError.message || '인증 중 오류가 발생했습니다.');
      }

      if (!verifyData?.success) {
        throw new Error(verifyData?.error || '인증에 실패했습니다.');
      }

      // Use the magic link to sign in
      if (verifyData.magicLink) {
        // Extract token from magic link
        const url = new URL(verifyData.magicLink);
        const token = url.searchParams.get('token');
        const type = url.searchParams.get('type');
        
        if (token && type) {
          const { error: verifyTokenError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          });

          if (verifyTokenError) {
            console.error('Token verification error:', verifyTokenError);
            throw new Error('인증 토큰 검증 실패');
          }

          toast.success(`${verifyData.user.role === 'super_admin' ? 'Master' : 'Admin'} 로그인 성공!`);
          navigate("/admin/dashboard");
          return;
        }
      }

      throw new Error('인증 정보가 올바르지 않습니다.');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-3 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
