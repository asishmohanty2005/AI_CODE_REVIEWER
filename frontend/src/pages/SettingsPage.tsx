import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage, usersApi } from "@/services/api";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [provider, setProvider] = useState(user?.preferred_ai_provider || "gemini");
  const [savingProvider, setSavingProvider] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const pwForm = useForm({
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  const saveProvider = async () => {
    setSavingProvider(true);
    try {
      const updated = await usersApi.updateProfile({
        preferred_ai_provider: provider,
      } as never);
      setUser(updated);
      toast.success("AI provider preference saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProvider(false);
    }
  };

  const changePassword = async (data: {
    current_password: string;
    new_password: string;
    confirm: string;
  }) => {
    if (data.new_password !== data.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (data.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await usersApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password updated");
      pwForm.reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>AI provider</CardTitle>
          <CardDescription>
            Choose the default model family for reviews and chat. You can still
            override this per review.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Default provider</Label>
            <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="gemini">Google Gemini (default)</option>
              <option value="openai">OpenAI</option>
            </Select>
          </div>
          <Button onClick={saveProvider} disabled={savingProvider}>
            {savingProvider ? <Spinner /> : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use a strong, unique password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={pwForm.handleSubmit(changePassword)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" {...pwForm.register("current_password")} />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" {...pwForm.register("new_password")} />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" {...pwForm.register("confirm")} />
            </div>
            <Button type="submit" disabled={savingPw}>
              {savingPw ? <Spinner /> : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Session and plan information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Email: <span className="text-white">{user?.email}</span>
          </p>
          <p>
            Username: <span className="text-white">@{user?.username}</span>
          </p>
          <p>
            Plan: <span className="text-white capitalize">{user?.plan}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
