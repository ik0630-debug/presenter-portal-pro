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
      // First, try to verify admin from external DB
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-admin', {
        body: { email, password },
      });

      if (verifyError || !verifyData?.success) {
        // If external verification fails, try local login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          toast.error("관리자 권한이 없습니다.");
          setIsLoading(false);
          return;
        }

        toast.success("로그인 성공!");
        navigate("/admin/dashboard");
      } else {
        // External admin verified, now sign in locally
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: verifyData.session.hashed_token || password,
        });

        if (signInError) {
          // If local sign in fails, it means user was just created, use magic link
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: verifyData.session.properties.access_token,
            refresh_token: verifyData.session.properties.refresh_token,
          });

          if (setSessionError) throw setSessionError;
        }

        toast.success(`${verifyData.user.role === 'super_admin' ? 'Master' : 'Admin'} 로그인 성공!`);
        navigate("/admin/dashboard");
      }
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
